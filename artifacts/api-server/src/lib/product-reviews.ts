import { and, avg, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  db,
  productReviewsTable,
  productsTable,
  type ProductReview,
} from "@workspace/db";

export type ProductReviewPublic = {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ProductReviewStats = {
  reviewCount: number;
  averageRating: number | null;
};

export async function getReviewStatsByProductIds(
  productIds: number[],
): Promise<Map<number, ProductReviewStats>> {
  const map = new Map<number, ProductReviewStats>();
  if (!productIds.length) return map;

  const rows = await db
    .select({
      productId: productReviewsTable.productId,
      reviewCount: count(),
      averageRating: avg(productReviewsTable.rating),
    })
    .from(productReviewsTable)
    .where(
      and(
        inArray(productReviewsTable.productId, productIds),
        eq(productReviewsTable.status, "published"),
      ),
    )
    .groupBy(productReviewsTable.productId);

  for (const row of rows) {
    map.set(row.productId, {
      reviewCount: Number(row.reviewCount),
      averageRating: row.averageRating != null ? Math.round(Number(row.averageRating) * 10) / 10 : null,
    });
  }

  return map;
}

export async function listPublishedReviewsForProduct(productId: number): Promise<ProductReviewPublic[]> {
  const rows = await db
    .select()
    .from(productReviewsTable)
    .where(and(eq(productReviewsTable.productId, productId), eq(productReviewsTable.status, "published")))
    .orderBy(desc(productReviewsTable.publishedAt), desc(productReviewsTable.createdAt));

  return rows.map(toPublicReview);
}

export async function submitProductReview(input: {
  productId: number;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<{ review: ProductReview; productName: string }> {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, input.productId));
  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("INVALID_RATING");
  }

  const authorName = input.authorName.trim();
  if (authorName.length < 2) {
    throw new Error("AUTHOR_NAME_TOO_SHORT");
  }

  const trimmedComment = input.comment.trim();
  if (trimmedComment.length < 10) {
    throw new Error("COMMENT_TOO_SHORT");
  }

  const [review] = await db
    .insert(productReviewsTable)
    .values({
      productId: input.productId,
      orderId: null,
      email: null,
      authorName,
      rating: input.rating,
      comment: trimmedComment,
      status: "pending",
    })
    .returning();

  return { review, productName: product.name };
}

export async function listAdminReviews(statusFilter: string) {
  const rows =
    statusFilter === "all"
      ? await db.select().from(productReviewsTable).orderBy(desc(productReviewsTable.createdAt))
      : await db
          .select()
          .from(productReviewsTable)
          .where(eq(productReviewsTable.status, statusFilter))
          .orderBy(desc(productReviewsTable.createdAt));

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    orderId: row.orderId,
    authorName: row.authorName,
    email: row.email,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  }));
}

export async function listReviewsForOrder(orderId: number) {
  const rows = await db
    .select({
      review: productReviewsTable,
      productName: productsTable.name,
    })
    .from(productReviewsTable)
    .leftJoin(productsTable, eq(productReviewsTable.productId, productsTable.id))
    .where(and(eq(productReviewsTable.orderId, orderId), isNotNull(productReviewsTable.orderId)))
    .orderBy(desc(productReviewsTable.createdAt));

  return rows.map(({ review, productName }) => ({
    id: review.id,
    productId: review.productId,
    productName: productName ?? null,
    orderId: review.orderId,
    authorName: review.authorName,
    email: review.email,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    publishedAt: review.publishedAt?.toISOString() ?? null,
  }));
}

export async function updateReviewStatus(
  reviewId: number,
  status: "published" | "rejected",
): Promise<void> {
  const [review] = await db.select().from(productReviewsTable).where(eq(productReviewsTable.id, reviewId));
  if (!review) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  await db
    .update(productReviewsTable)
    .set({
      status,
      publishedAt: status === "published" ? (review.publishedAt ?? new Date()) : null,
    })
    .where(eq(productReviewsTable.id, reviewId));
}

export async function publishPendingReviewsForOrder(orderId: number): Promise<number> {
  const pending = await db
    .select()
    .from(productReviewsTable)
    .where(and(eq(productReviewsTable.orderId, orderId), eq(productReviewsTable.status, "pending")));

  if (!pending.length) return 0;

  const now = new Date();
  await db
    .update(productReviewsTable)
    .set({ status: "published", publishedAt: now })
    .where(and(eq(productReviewsTable.orderId, orderId), eq(productReviewsTable.status, "pending")));

  return pending.length;
}

function toPublicReview(row: ProductReview): ProductReviewPublic {
  return {
    id: row.id,
    productId: row.productId,
    authorName: row.authorName,
    rating: row.rating,
    comment: row.comment,
    createdAt: (row.publishedAt ?? row.createdAt).toISOString(),
  };
}
