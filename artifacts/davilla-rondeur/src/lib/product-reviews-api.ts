import { customFetch } from "@workspace/api-client-react";

export type ProductReviewPublic = {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  comment: string;
  photoUrls?: string[];
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
  photos?: File[];
};

export function listProductReviews(productId: number) {
  return customFetch<ProductReviewPublic[]>(`/api/products/${productId}/reviews`);
}

export function submitProductReview(productId: number, data: SubmitProductReviewInput) {
  const formData = new FormData();
  formData.append("authorName", data.authorName);
  formData.append("rating", String(data.rating));
  formData.append("comment", data.comment);
  for (const photo of data.photos ?? []) {
    formData.append("photos", photo);
  }

  return customFetch<{ id: number; message: string; status: string }>(`/api/products/${productId}/reviews`, {
    method: "POST",
    body: formData,
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
