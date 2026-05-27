import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import {
  db,
  cartItemsTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  type Order,
  type OrderItem,
} from "@workspace/db";
import { sendOrderConfirmationEmail } from "./email";
import { logger } from "./logger";
import { extractShippingFromCheckoutSession } from "./stripe-shipping";

export type OrderResponse = {
  id: number;
  email: string;
  status: string;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    productImageUrl: string | null;
    price: number;
    quantity: number;
    size: string | null;
    color: string | null;
  }>;
  subtotal: number;
  shippingAmount: number;
  total: number;
  shippingAddress: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  stripeSessionId: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

export function formatOrder(order: Order, items: OrderItem[]): OrderResponse {
  const subtotal = parseFloat(order.subtotal);
  const shippingAmount = parseFloat(order.shippingAmount);
  const total = parseFloat(order.total);

  const hasShipping =
    order.shippingLine1 ||
    order.shippingCity ||
    order.shippingPostalCode ||
    order.shippingCountry;

  return {
    id: order.id,
    email: order.email,
    status: order.status,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      price: parseFloat(item.price),
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    subtotal,
    shippingAmount,
    total,
    shippingAddress: hasShipping
      ? {
          name: order.shippingName,
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        }
      : null,
    stripeSessionId: order.stripeSessionId,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}

export async function getOrderWithItems(orderId: number): Promise<OrderResponse | null> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  return formatOrder(order, items);
}

export async function getOrderByStripeSessionId(stripeSessionId: string): Promise<OrderResponse | null> {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.stripeSessionId, stripeSessionId));

  if (!order) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return formatOrder(order, items);
}

export async function createPendingOrderFromCart(sessionId: string, email: string) {
  const cartItems = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  if (cartItems.length === 0) {
    throw new OrderError("Votre panier est vide", 404);
  }

  for (const item of cartItems) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, item.productId));

    if (!product || !product.inStock) {
      throw new OrderError(`Le produit « ${item.productName} » n'est plus disponible`, 404);
    }
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );
  const shippingAmount = 0;
  const total = subtotal + shippingAmount;

  const [order] = await db
    .insert(ordersTable)
    .values({
      sessionId,
      email,
      status: "pending",
      subtotal: subtotal.toFixed(2),
      shippingAmount: shippingAmount.toFixed(2),
      total: total.toFixed(2),
    })
    .returning();

  await db.insert(orderItemsTable).values(
    cartItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
  );

  return { order, cartItems, subtotal, shippingAmount, total };
}

export async function fulfillOrderFromStripeSession(
  stripeSession: Stripe.Checkout.Session,
): Promise<OrderResponse | null> {
  const orderId = Number.parseInt(stripeSession.metadata?.orderId ?? "", 10);
  if (!Number.isFinite(orderId)) {
    logger.error({ stripeSessionId: stripeSession.id }, "Stripe session missing orderId metadata");
    return null;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) {
    logger.error({ orderId }, "Order not found for Stripe session");
    return null;
  }

  if (order.status === "paid") {
    return getOrderWithItems(order.id);
  }

  const shipping = extractShippingFromCheckoutSession(stripeSession);
  const paymentIntentId =
    typeof stripeSession.payment_intent === "string"
      ? stripeSession.payment_intent
      : stripeSession.payment_intent?.id ?? null;

  if (!shipping?.line1) {
    logger.warn(
      { orderId: order.id, stripeSessionId: stripeSession.id },
      "Commande payée sans adresse de livraison Stripe",
    );
  }

  await db
    .update(ordersTable)
    .set({
      status: "paid",
      stripeSessionId: stripeSession.id,
      stripePaymentIntentId: paymentIntentId,
      paidAt: new Date(),
      shippingName: shipping?.name ?? null,
      shippingLine1: shipping?.line1 ?? null,
      shippingLine2: shipping?.line2 ?? null,
      shippingCity: shipping?.city ?? null,
      shippingPostalCode: shipping?.postalCode ?? null,
      shippingCountry: shipping?.country ?? null,
    })
    .where(eq(ordersTable.id, order.id));

  if (order.sessionId) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, order.sessionId));
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

  await sendOrderConfirmationEmail({
    orderId: order.id,
    email: order.email,
    total: parseFloat(order.total),
    items: items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: parseFloat(item.price),
    })),
  });

  return getOrderWithItems(order.id);
}

export async function cancelPendingOrder(orderId: number): Promise<void> {
  await db
    .update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, orderId));
}

export class OrderError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrderError";
  }
}
