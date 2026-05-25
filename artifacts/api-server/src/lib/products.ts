import type { categoriesTable, productsTable } from "@workspace/db";

export const buildProductResponse = (
  p: typeof productsTable.$inferSelect,
  c: typeof categoriesTable.$inferSelect | null,
) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  price: parseFloat(p.price),
  originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
  imageUrl: p.imageUrl,
  images: p.images ?? [],
  categoryId: p.categoryId,
  categoryName: c?.name ?? null,
  label: p.label,
  inStock: p.inStock,
  featured: p.featured,
  sizes: p.sizes ?? [],
  colors: p.colors ?? [],
});

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
