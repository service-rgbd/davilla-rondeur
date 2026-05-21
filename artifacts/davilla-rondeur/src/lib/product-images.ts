import siropMenthePrimary from "@assets/photo_2026-05-21_22.01.40_1779400929063.jpeg";
import siropMentheSecondary from "@assets/photo_2026-05-21_22.01.50_1779400929061.jpeg";
import siropMielPrimary from "@assets/photo_2026-05-21_22.00.57_1779400929066.jpeg";
import siropMielSecondary from "@assets/photo_2026-05-21_22.01.33_1779400929064.jpeg";
import bodyBoosterPrimary from "@assets/photo_2026-05-21_22.01.10_1779400929066.jpeg";
import bodyBoosterSecondary from "@assets/photo_2026-05-21_22.01.23_1779400929064.jpeg";
import allProducts from "@assets/photo_2026-05-21_22.01.23_1779400929064.jpeg";

export const PRODUCT_IMAGES: Record<string, { primary: string; gallery: string[] }> = {
  "sirop-menthe": {
    primary: siropMenthePrimary,
    gallery: [siropMenthePrimary, siropMentheSecondary],
  },
  "sirop-miel": {
    primary: siropMielPrimary,
    gallery: [siropMielPrimary, siropMielSecondary],
  },
  "body-booster-cure-kayana": {
    primary: bodyBoosterPrimary,
    gallery: [bodyBoosterPrimary, bodyBoosterSecondary],
  },
  "coffret-duo-sirops": {
    primary: siropMielSecondary,
    gallery: [siropMielSecondary, allProducts],
  },
};

export const CATEGORY_IMAGES: Record<string, string> = {
  "sirops-naturels": siropMenthePrimary,
  "complements-alimentaires": bodyBoosterPrimary,
  "soins-bien-etre": allProducts,
};

export const HERO_IMAGE = allProducts;

export function getProductImage(slug: string): string {
  return PRODUCT_IMAGES[slug]?.primary ?? "";
}

export function getProductGallery(slug: string): string[] {
  return PRODUCT_IMAGES[slug]?.gallery ?? [];
}
