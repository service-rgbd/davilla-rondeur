import { Router, type IRouter } from "express";
import { count, desc, eq } from "drizzle-orm";
import { db, newsletterSubscribersTable, orderItemsTable, ordersTable } from "@workspace/db";
import { requireAdmin } from "../../lib/auth";
import { orderNeedsStripeReconcile, reconcileOrdersWithStripe } from "../../lib/orders";

const router: IRouter = Router();

const PAID_STATUSES = ["paid", "shipped", "delivered"] as const;

router.get("/admin/dashboard/stats", requireAdmin, async (_req, res): Promise<void> => {
  let allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const subscribers = await db.select({ count: count() }).from(newsletterSubscribersTable);

  const reconcileIds = allOrders.filter(orderNeedsStripeReconcile).map((order) => order.id);
  if (reconcileIds.length > 0) {
    await reconcileOrdersWithStripe(reconcileIds.slice(0, 30));
    allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  }

  const ordersByStatus: Record<string, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  let totalRevenue = 0;
  const revenueByDayMap = new Map<string, number>();

  for (const order of allOrders) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;

    if (PAID_STATUSES.includes(order.status as (typeof PAID_STATUSES)[number])) {
      const total = parseFloat(order.total);
      totalRevenue += total;

      const dayKey = (order.paidAt ?? order.createdAt).toISOString().slice(0, 10);
      revenueByDayMap.set(dayKey, (revenueByDayMap.get(dayKey) ?? 0) + total);
    }
  }

  const revenueByDay = [...revenueByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));

  const recentOrderRows = allOrders.slice(0, 8);
  const recentOrders = await Promise.all(
    recentOrderRows.map(async (order) => {
      const items = await db
        .select({ count: count() })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));

      return {
        id: order.id,
        email: order.email,
        status: order.status,
        total: parseFloat(order.total),
        subtotal: parseFloat(order.subtotal),
        shippingAmount: parseFloat(order.shippingAmount),
        itemCount: items[0]?.count ?? 0,
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
    }),
  );

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    ordersByStatus,
    newsletterSubscribers: subscribers[0]?.count ?? 0,
    revenueByDay,
    recentOrders,
  });
});

export default router;
