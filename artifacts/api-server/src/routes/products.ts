import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
} from "@workspace/api-zod";
import { buildProductResponse } from "../lib/products";
import { getReviewStatsByProductIds } from "../lib/product-reviews";

const router: IRouter = Router();

async function withReviewStats<T extends { id: number }>(products: T[]) {
  const stats = await getReviewStatsByProductIds(products.map((p) => p.id));
  return products.map((p) => {
    const reviewStats = stats.get(p.id);
    return {
      ...p,
      reviewCount: reviewStats?.reviewCount ?? 0,
      averageRating: reviewStats?.averageRating ?? null,
    };
  });
}

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.featured, true))
    .orderBy(desc(productsTable.id))
    .limit(6);

  const products = rows.map((r) => buildProductResponse(r.products, r.categories));
  res.json(await withReviewStats(products));
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(productsTable.id));

  if (limit != null) query.limit(limit);

  const rows = await query;
  const products = rows.map((r) => buildProductResponse(r.products, r.categories));
  res.json(await withReviewStats(products));
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

  const product = buildProductResponse(row.products, row.categories);
  const [withStats] = await withReviewStats([product]);
  res.json(withStats);
});

export default router;
