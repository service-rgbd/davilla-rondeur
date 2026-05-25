import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, newsletterSubscribersTable, ordersTable } from "@workspace/db";
import { requireAdmin } from "../../lib/auth";

const router: IRouter = Router();

const PAID_STATUSES = new Set(["paid", "shipped", "delivered"]);

router.get("/admin/customers", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const subscribers = await db.select().from(newsletterSubscribersTable);

  type CustomerRow = {
    email: string;
    name: string | null;
    city: string | null;
    country: string | null;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: Date;
    sources: Set<"order" | "newsletter">;
  };

  const byEmail = new Map<string, CustomerRow>();

  for (const order of orders) {
    const key = order.email.trim().toLowerCase();
    const existing = byEmail.get(key);
    const spent = PAID_STATUSES.has(order.status) ? parseFloat(order.total) : 0;

    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += spent;
      if (order.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt;
        existing.name = order.shippingName ?? existing.name;
        existing.city = order.shippingCity ?? existing.city;
        existing.country = order.shippingCountry ?? existing.country;
      }
      existing.sources.add("order");
    } else {
      byEmail.set(key, {
        email: order.email,
        name: order.shippingName,
        city: order.shippingCity,
        country: order.shippingCountry,
        orderCount: 1,
        totalSpent: spent,
        lastOrderAt: order.createdAt,
        sources: new Set(["order"]),
      });
    }
  }

  for (const sub of subscribers) {
    const key = sub.email.trim().toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.sources.add("newsletter");
    } else {
      byEmail.set(key, {
        email: sub.email,
        name: null,
        city: null,
        country: null,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: sub.subscribedAt,
        sources: new Set(["newsletter"]),
      });
    }
  }

  const customers = [...byEmail.values()]
    .sort((a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime())
    .map((row) => ({
      email: row.email,
      name: row.name,
      phone: null,
      city: row.city,
      country: row.country,
      orderCount: row.orderCount,
      totalSpent: Math.round(row.totalSpent * 100) / 100,
      lastOrderAt: row.lastOrderAt.toISOString(),
      sources: [...row.sources],
    }));

  res.json(customers);
});

export default router;
