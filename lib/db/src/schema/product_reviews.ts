import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const productReviewsTable = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"),
  authorName: text("author_name").notNull(),
  email: text("email"),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export type ProductReview = typeof productReviewsTable.$inferSelect;
