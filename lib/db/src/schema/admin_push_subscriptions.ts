import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const adminPushSubscriptionsTable = pgTable("admin_push_subscriptions", {
  id: serial("id").primaryKey(),
  adminEmail: text("admin_email").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminPushSubscription = typeof adminPushSubscriptionsTable.$inferSelect;
