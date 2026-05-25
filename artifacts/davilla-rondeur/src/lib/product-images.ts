import type { Product } from "@workspace/api-client-react";

export const CATEGORY_IMAGES: Record<string, string> = {
  "sirops-naturels": "/images/Sirop-menthe.jpeg",
  "complements-alimentaires": "/images/Body-booster-prise-de-poids.jpeg",
  "soins-bien-etre": "/images/Sirop-booster-cure-kayana.jpeg",
};

export const HERO_IMAGE = "/images/photo_2026-05-24%2017.46.23.jpeg";

export function resolveProductImage(product: Pick<Product, "imageUrl" | "images">): string {
  return product.imageUrl || product.images?.[0] || "";
}

export function resolveProductGallery(product: Pick<Product, "imageUrl" | "images">): string[] {
  if (product.images?.length) return product.images;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}

/** @deprecated Utiliser resolveProductImage(product) — les images viennent de la DB / R2 */
export function getProductImage(_slug: string | undefined): string {
  return "";
}

/** @deprecated Utiliser resolveProductGallery(product) */
export function getProductGallery(_slug: string | undefined): string[] {
  return [];
}
