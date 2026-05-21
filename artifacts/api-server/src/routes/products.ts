import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const buildProductResponse = (p: typeof productsTable.$inferSelect, c: typeof categoriesTable.$inferSelect | null) => ({
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

router.get("/products/featured", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.featured, true))
    .limit(6);

  res.json(rows.map(r => buildProductResponse(r.products, r.categories)));
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { categoryId, featured, limit } = parsed.data;

  const conditions = [];
  if (categoryId != null) conditions.push(eq(productsTable.categoryId, categoryId));
  if (featured != null) conditions.push(eq(productsTable.featured, featured));

  const query = db
    .select()
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (limit != null) query.limit(limit);

  const rows = await query;
  res.json(rows.map(r => buildProductResponse(r.products, r.categories)));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  res.json(buildProductResponse(row.products, row.categories));
});

export default router;
