import { customFetch } from "@workspace/api-client-react";

export type ProductReviewPublic = {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type AdminProductReview = ProductReviewPublic & {
  orderId: number | null;
  email: string | null;
  status: string;
  publishedAt: string | null;
  productName?: string | null;
};

export type SubmitProductReviewInput = {
  authorName: string;
  rating: number;
  comment: string;
};

export function listProductReviews(productId: number) {
  return customFetch<ProductReviewPublic[]>(`/api/products/${productId}/reviews`);
}

export function submitProductReview(productId: number, data: SubmitProductReviewInput) {
  return customFetch<{ id: number; message: string; status: string }>(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function listAdminReviews(status: string) {
  const query = new URLSearchParams({ status });
  return customFetch<AdminProductReview[]>(`/api/admin/reviews?${query.toString()}`);
}

export function updateAdminReviewStatus(reviewId: number, status: "published" | "rejected") {
  return customFetch<{ message: string }>(`/api/admin/reviews/${reviewId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function publishOrderReviews(orderId: number) {
  return customFetch<{ message: string; publishedCount: number }>(
    `/api/admin/orders/${orderId}/publish-reviews`,
    { method: "POST" },
  );
}

export function listOrderReviews(orderId: number) {
  return customFetch<AdminProductReview[]>(`/api/admin/orders/${orderId}/reviews`);
}
