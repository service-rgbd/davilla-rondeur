import type { Product } from "@workspace/api-client-react";

export const CATEGORY_IMAGES: Record<string, string> = {
  "sirops-naturels": "/images/Sirop-menthe.jpeg",
  "complements-alimentaires": "/images/Body-booster-prise-de-poids.jpeg",
  "soins-bien-etre": "/images/Sirop-booster-cure-kayana.jpeg",
};

export const HERO_IMAGE = "/images/photo_2026-05-24%2017.46.23.jpeg";

function getMediaApiBase(): string {
  const api = import.meta.env.VITE_API_BASE_URL;
  if (typeof api === "string" && api.trim() !== "") {
    return `${api.replace(/\/+$/, "")}/api/media`;
  }
  return "https://api.davilla-rondeur.fr/api/media";
}

/** Réécrit media.davilla-rondeur.fr vers le proxy API si le domaine custom R2 n'est pas actif. */
export function normalizeMediaUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed.startsWith("https://media.davilla-rondeur.fr/")) {
    const key = trimmed.slice("https://media.davilla-rondeur.fr/".length);
    return `${getMediaApiBase()}/${key}`;
  }
  return trimmed;
}

export function resolveProductImage(product: Pick<Product, "imageUrl" | "images">): string {
  const raw = product.imageUrl || product.images?.[0] || "";
  return normalizeMediaUrl(raw);
}

export function resolveProductGallery(product: Pick<Product, "imageUrl" | "images">): string[] {
  const urls = product.images?.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  return urls.map(normalizeMediaUrl);
}

/** @deprecated Utiliser resolveProductImage(product) — les images viennent de la DB / R2 */
export function getProductImage(_slug: string | undefined): string {
  return "";
}

/** @deprecated Utiliser resolveProductGallery(product) */
export function getProductGallery(_slug: string | undefined): string[] {
  return [];
}
