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
  });
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
  });
});

export default router;
