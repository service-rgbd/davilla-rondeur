import { Router, type IRouter } from "express";
import { count, desc, eq } from "drizzle-orm";
import { db, orderItemsTable, ordersTable } from "@workspace/db";
import { AdminUpdateOrderBody } from "@workspace/api-zod";
import { requireAdmin } from "../../lib/auth";
import { getOrderWithItems, syncMissingOrdersShippingFromStripe, syncOrderShippingFromStripe } from "../../lib/orders";

const router: IRouter = Router();

const VALID_STATUSES = new Set(["pending", "paid", "shipped", "delivered", "cancelled"]);
const PAID_STATUSES = new Set(["paid", "shipped", "delivered"]);

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : "all";

  const orders =
    statusFilter === "all" || !VALID_STATUSES.has(statusFilter)
      ? await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt))
      : await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.status, statusFilter))
          .orderBy(desc(ordersTable.createdAt));

  const missingShippingIds = orders
    .filter(
      (order) =>
        PAID_STATUSES.has(order.status) &&
        order.stripeSessionId &&
        !order.shippingLine1 &&
        !order.shippingCity &&
        !order.shippingPostalCode &&
        !order.shippingCountry,
    )
    .map((order) => order.id);

  if (missingShippingIds.length > 0) {
    await syncMissingOrdersShippingFromStripe(missingShippingIds);
  }

  const refreshedOrders =
    missingShippingIds.length > 0
      ? statusFilter === "all" || !VALID_STATUSES.has(statusFilter)
        ? await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt))
        : await db
            .select()
            .from(ordersTable)
            .where(eq(ordersTable.status, statusFilter))
            .orderBy(desc(ordersTable.createdAt))
      : orders;

  const summaries = await Promise.all(
    refreshedOrders.map(async (order) => {
      const items = await db
        .select({ count: count() })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));

      return {
        id: order.id,
        email: order.email,
        status: order.status,
        total: parseFloat(order.total),
        itemCount: items[0]?.count ?? 0,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        shippingCity: order.shippingCity,
        shippingCountry: order.shippingCountry,
      };
    }),
  );

  res.json(summaries);
});

router.get("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  let order = await getOrderWithItems(id);
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  if (!order.shippingAddress?.line1 && order.stripeSessionId) {
    order = (await syncOrderShippingFromStripe(id)) ?? order;
  }

  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  });
});

router.patch("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number.parseInt(req.params.id, 10);
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
