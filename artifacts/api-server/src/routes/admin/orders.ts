import { Router, type IRouter } from "express";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db, orderItemsTable, ordersTable, type Order } from "@workspace/db";
import { AdminUpdateOrderBody } from "@workspace/api-zod";
import { requireAdmin } from "../../lib/auth";
import {
  getOrderWithItems,
  orderNeedsStripeReconcile,
  reconcileOrderWithStripe,
  reconcileRecentPendingOrders,
  scheduleRecentPendingReconcile,
} from "../../lib/orders";
import { publishPendingReviewsForOrder } from "../../lib/product-reviews";
import {
  generateColissimoLabel,
  getColissimoConfig,
  getShipFromAddress,
  isColissimoConfigured,
} from "../../lib/colissimo";
import { z } from "zod";

const router: IRouter = Router();

const VALID_STATUSES = new Set(["pending", "paid", "shipped", "delivered", "cancelled"]);

function toAdminOrderSummary(
  order: Order,
  itemCount: number,
) {
  return {
    id: order.id,
    email: order.email,
    status: order.status,
    total: parseFloat(order.total),
    subtotal: parseFloat(order.subtotal),
    shippingAmount: parseFloat(order.shippingAmount),
    itemCount,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    shippingName: order.shippingName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    shippingPhone: order.shippingPhone,
  };
}

async function loadOrders(statusFilter: string) {
  return statusFilter === "all" || !VALID_STATUSES.has(statusFilter)
    ? db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt))
    : db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.status, statusFilter))
        .orderBy(desc(ordersTable.createdAt));
}

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : "all";

  if (statusFilter === "pending") {
    await reconcileRecentPendingOrders(8);
  } else if (statusFilter === "all") {
    scheduleRecentPendingReconcile(5);
  }

  const orders = await loadOrders(statusFilter);

  const orderIds = orders.map((order) => order.id);
  const itemCountRows =
    orderIds.length > 0
      ? await db
          .select({ orderId: orderItemsTable.orderId, count: count() })
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, orderIds))
          .groupBy(orderItemsTable.orderId)
      : [];

  const itemCountByOrderId = new Map(itemCountRows.map((row) => [row.orderId, row.count]));

  const summaries = orders.map((order) =>
    toAdminOrderSummary(order, itemCountByOrderId.get(order.id) ?? 0),
  );

  res.json(summaries);
});

router.get("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const order = await reconcileOrderWithStripe(id);
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
  });
});

router.get("/admin/colissimo/status", requireAdmin, (_req, res): void => {
  const config = getColissimoConfig();
  res.json({
    configured: isColissimoConfigured(),
    shipFrom: getShipFromAddress(),
    productCodeFrance: config?.productCodeFrance ?? "DOM",
    productCodeInternational: config?.productCodeInternational ?? "COLI",
    defaultWeightGrams: config?.defaultWeightGrams ?? 500,
  });
});

const ColissimoLabelBody = z.object({
  weightGrams: z.number().int().min(100).max(30000).optional(),
});

router.post("/admin/orders/:id/colissimo-label", requireAdmin, async (req, res): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const parsed = ColissimoLabelBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  if (!["paid", "shipped"].includes(existing.status)) {
    res.status(400).json({ error: "Seules les commandes payées peuvent recevoir une étiquette Colissimo" });
    return;
  }

  try {
    const label = await generateColissimoLabel(existing, parsed.data.weightGrams);
    const now = new Date();

    await db
      .update(ordersTable)
      .set({
        trackingNumber: label.parcelNumber,
        carrier: "colissimo",
        colissimoLabelUrl: label.labelUrl || existing.colissimoLabelUrl,
        packageWeightGrams: parsed.data.weightGrams ?? existing.packageWeightGrams ?? getColissimoConfig()?.defaultWeightGrams ?? 500,
        status: "shipped",
        shippedAt: existing.shippedAt ?? now,
      })
      .where(eq(ordersTable.id, id));

    const order = await getOrderWithItems(id);
    if (!order) {
      res.status(404).json({ error: "Commande introuvable" });
      return;
    }

    res.json({
      message: "Étiquette Colissimo générée",
      parcelNumber: label.parcelNumber,
      trackingUrl: label.trackingUrl,
      labelUrl: label.labelUrl,
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        shippedAt: order.shippedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COLISSIMO_NOT_CONFIGURED") {
        res.status(503).json({ error: "Colissimo non configuré sur le serveur (variables COLISSIMO_*)" });
        return;
      }
      if (error.message === "COLISSIMO_MISSING_ADDRESS") {
        res.status(400).json({ error: "Adresse de livraison incomplète pour Colissimo" });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Impossible de générer l'étiquette Colissimo" });
  }
});

router.patch("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const parsed = AdminUpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  await db.update(ordersTable).set({ status: parsed.data.status }).where(eq(ordersTable.id, id));

  if (parsed.data.status === "delivered") {
    await publishPendingReviewsForOrder(id);
  }

  const order = await getOrderWithItems(id);
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
  });
});

export default router;
