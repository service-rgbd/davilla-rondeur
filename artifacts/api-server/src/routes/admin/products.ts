import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import {
  AdminCreateProductBody,
  AdminUpdateProductBody,
  AdminGetProductParams,
  AdminDeleteProductParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../../lib/auth";
import { buildProductResponse, slugify } from "../../lib/products";

const router: IRouter = Router();

router.use(requireAdmin);

router.get("/admin/products", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(productsTable.id);

  res.json(rows.map((r) => buildProductResponse(r.products, r.categories)));
});

router.get("/admin/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = AdminGetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  res.json(buildProductResponse(row.products, row.categories));
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = AdminCreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);

  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, data.categoryId));

  if (!category) {
    res.status(400).json({ error: "Catégorie introuvable" });
    return;
  }

  try {
    const [created] = await db
      .insert(productsTable)
      .values({
        name: data.name,
        slug,
        description: data.description ?? null,
        price: data.price.toFixed(2),
        originalPrice: data.originalPrice != null ? data.originalPrice.toFixed(2) : null,
        imageUrl: data.imageUrl ?? null,
        images: data.images ?? [],
        categoryId: data.categoryId,
        label: data.label ?? null,
        inStock: data.inStock ?? true,
        featured: data.featured ?? false,
        sizes: data.sizes ?? [],
        colors: data.colors ?? [],
      })
      .returning();

    res.status(201).json(buildProductResponse(created, category));
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      res.status(409).json({ error: "Ce slug existe déjà" });
      return;
    }
    throw err;
  }
});

router.patch("/admin/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminGetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  if (data.categoryId != null) {
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, data.categoryId));
    if (!category) {
      res.status(400).json({ error: "Catégorie introuvable" });
      return;
    }
  }

  const updates: Partial<typeof productsTable.$inferInsert> = {};
  if (data.name != null) updates.name = data.name;
  if (data.slug != null) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.price != null) updates.price = data.price.toFixed(2);
  if (data.originalPrice !== undefined) {
    updates.originalPrice = data.originalPrice != null ? data.originalPrice.toFixed(2) : null;
  }
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
  if (data.images != null) updates.images = data.images;
  if (data.categoryId != null) updates.categoryId = data.categoryId;
  if (data.label !== undefined) updates.label = data.label;
  if (data.inStock != null) updates.inStock = data.inStock;
  if (data.featured != null) updates.featured = data.featured;
  if (data.sizes != null) updates.sizes = data.sizes;
  if (data.colors != null) updates.colors = data.colors;

  try {
    const [updated] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, params.data.id))
      .returning();

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, updated.categoryId));

    res.json(buildProductResponse(updated, category ?? null));
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      res.status(409).json({ error: "Ce slug existe déjà" });
      return;
    }
    throw err;
  }
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = AdminDeleteProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deleted] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, parsed.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  res.json({ message: "Produit supprimé" });
});

export default router;
