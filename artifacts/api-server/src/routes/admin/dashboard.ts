import { Router, type IRouter } from "express";
import { count, desc, eq, inArray, sum } from "drizzle-orm";
import { db, newsletterSubscribersTable, orderItemsTable, ordersTable } from "@workspace/db";
import { requireAdmin } from "../../lib/auth";
import { scheduleRecentPendingReconcile } from "../../lib/orders";

const router: IRouter = Router();

const PAID_STATUSES = ["paid", "shipped", "delivered"] as const;
const ALL_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

router.get("/admin/dashboard/stats", requireAdmin, async (_req, res): Promise<void> => {
  scheduleRecentPendingReconcile(5);

  const [statusRows, revenueRow, subscribers, paidOrders, recentOrderRows] = await Promise.all([
    db
      .select({ status: ordersTable.status, count: count() })
      .from(ordersTable)
      .groupBy(ordersTable.status),
    db
      .select({ total: sum(ordersTable.total) })
      .from(ordersTable)
      .where(inArray(ordersTable.status, [...PAID_STATUSES])),
    db.select({ count: count() }).from(newsletterSubscribersTable),
    db
      .select({
        total: ordersTable.total,
        paidAt: ordersTable.paidAt,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .where(inArray(ordersTable.status, [...PAID_STATUSES])),
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(8),
  ]);

  const ordersByStatus: Record<string, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const status of ALL_STATUSES) {
    const row = statusRows.find((entry) => entry.status === status);
    ordersByStatus[status] = row?.count ?? 0;
  }

  const totalRevenue = parseFloat(revenueRow[0]?.total ?? "0") || 0;

  const revenueByDayMap = new Map<string, number>();
  for (const order of paidOrders) {
    const dayKey = (order.paidAt ?? order.createdAt).toISOString().slice(0, 10);
    revenueByDayMap.set(dayKey, (revenueByDayMap.get(dayKey) ?? 0) + parseFloat(order.total));
  }

  const revenueByDay = [...revenueByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));

  const recentIds = recentOrderRows.map((order) => order.id);
  const itemCountRows =
    recentIds.length > 0
      ? await db
          .select({ orderId: orderItemsTable.orderId, count: count() })
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, recentIds))
          .groupBy(orderItemsTable.orderId)
      : [];

  const itemCountByOrderId = new Map(itemCountRows.map((row) => [row.orderId, row.count]));

  const recentOrders = recentOrderRows.map((order) => ({
    id: order.id,
    email: order.email,
    status: order.status,
    total: parseFloat(order.total),
    subtotal: parseFloat(order.subtotal),
    shippingAmount: parseFloat(order.shippingAmount),
    itemCount: itemCountByOrderId.get(order.id) ?? 0,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    shippingName: order.shippingName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    shippingPhone: order.shippingPhone,
  }));

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    ordersByStatus,
    newsletterSubscribers: subscribers[0]?.count ?? 0,
    revenueByDay,
    recentOrders,
  });
});

export default router;
