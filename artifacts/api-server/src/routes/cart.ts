import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { AddToCartBody, RemoveFromCartParams, GetCartQueryParams, UpdateCartItemBody } from "@workspace/api-zod";

const router: IRouter = Router();

const buildCart = (sessionId: string, items: typeof cartItemsTable.$inferSelect[]) => {
  const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    sessionId,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImageUrl: i.productImageUrl,
      price: parseFloat(i.price),
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
    total,
    itemCount,
  };
};

router.get("/cart", async (req, res): Promise<void> => {
  const parsed = GetCartQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, parsed.data.sessionId));

  res.json(buildCart(parsed.data.sessionId, items));
});

router.post("/cart", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, productId, quantity, size, color } = parsed.data;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  const existingConditions = [
    eq(cartItemsTable.sessionId, sessionId),
    eq(cartItemsTable.productId, productId),
  ];
  if (size) existingConditions.push(eq(cartItemsTable.size, size));
  if (color) existingConditions.push(eq(cartItemsTable.color, color));

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(and(...existingConditions));

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      sessionId,
      productId,
      productName: product.name,
      productImageUrl: product.imageUrl,
      price: product.price,
      quantity,
      size: size ?? null,
      color: color ?? null,
    });
  }

  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  res.json(buildCart(sessionId, items));
});

router.patch("/cart/:itemId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = RemoveFromCartParams.safeParse({ itemId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.id, params.data.itemId));

  if (!existing) {
    res.status(404).json({ error: "Article introuvable" });
    return;
  }

  await db
    .update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItemsTable.id, params.data.itemId));

  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, existing.sessionId));

  res.json(buildCart(existing.sessionId, items));
});

router.delete("/cart/:itemId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = RemoveFromCartParams.safeParse({ itemId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(cartItemsTable)
    .where(eq(cartItemsTable.id, params.data.itemId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Article introuvable" });
    return;
  }

  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, deleted.sessionId));

  res.json(buildCart(deleted.sessionId, items));
});

export default router;
