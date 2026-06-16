import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const productReviewsTable = pgTable(
  "product_reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull(),
    orderId: integer("order_id").notNull(),
    authorName: text("author_name").notNull(),
    email: text("email").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
  },
  (table) => ({
    orderProductUnique: uniqueIndex("product_reviews_order_product_unique").on(
      table.orderId,
      table.productId,
    ),
  }),
);

export type ProductReview = typeof productReviewsTable.$inferSelect;
