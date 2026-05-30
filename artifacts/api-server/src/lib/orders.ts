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
import { sendOrderConfirmationEmail, isResendConfigured } from "./email";
import { logger } from "./logger";
import { getStripe, isStripeConfigured } from "./stripe";
import {
  type ExtractedShipping,
  describeStripeKeyMismatch,
  extractShippingFromCheckoutSession,
  getPaymentIntentIdFromSession,
  resolveShippingFromCheckoutSession,
} from "./stripe-shipping";

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

function orderHasShipping(order: Order): boolean {
  return Boolean(
    order.shippingLine1 ||
      order.shippingCity ||
      order.shippingPostalCode ||
      order.shippingCountry,
  );
}

async function applyShippingToOrder(
  orderId: number,
  shipping: ExtractedShipping,
  paymentIntentId?: string | null,
): Promise<void> {
  await db
    .update(ordersTable)
    .set({
      shippingName: shipping.name,
      shippingLine1: shipping.line1,
      shippingLine2: shipping.line2,
      shippingCity: shipping.city,
      shippingPostalCode: shipping.postalCode,
      shippingCountry: shipping.country,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    })
    .where(eq(ordersTable.id, orderId));
}

const CONFIRMATION_EMAIL_SENT = "confirmationEmailSent";

function orderIsPaid(status: string): boolean {
  return status === "paid" || status === "shipped" || status === "delivered";
}

function shippingFromOrder(order: Order): ExtractedShipping | null {
  if (!order.shippingLine1) return null;
  return {
    name: order.shippingName,
    line1: order.shippingLine1,
    line2: order.shippingLine2,
    city: order.shippingCity,
    postalCode: order.shippingPostalCode,
    country: order.shippingCountry,
  };
}

async function maybeSendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[],
  stripeSession: Stripe.Checkout.Session,
  shipping: ExtractedShipping | null,
): Promise<boolean> {
  if (stripeSession.metadata?.[CONFIRMATION_EMAIL_SENT] === "true") {
    return false;
  }

  if (!isResendConfigured()) {
    logger.warn(
      { orderId: order.id, email: order.email },
      "Email de confirmation ignoré — configurez RESEND_API_KEY sur Render",
    );
    return false;
  }

  const recipientEmail =
    stripeSession.customer_details?.email?.trim() || order.email.trim();

  const sent = await sendOrderConfirmationEmail({
    orderId: order.id,
    email: recipientEmail,
    total: parseFloat(order.total),
    items: items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: parseFloat(item.price),
    })),
    shippingAddress: shipping?.line1 ? shipping : null,
  });

  if (!sent) {
    return false;
  }

  try {
    const stripe = getStripe();
    await stripe.checkout.sessions.update(stripeSession.id, {
      metadata: {
        ...stripeSession.metadata,
        [CONFIRMATION_EMAIL_SENT]: "true",
      },
    });
  } catch (error) {
    logger.warn(
      { err: error, orderId: order.id, stripeSessionId: stripeSession.id },
      "Email envoyé mais impossible de marquer la session Stripe",
    );
  }

  return true;
}

/** Garantit l'envoi de l'email si la commande est payée (webhook ou page succès). */
export async function ensureOrderConfirmationEmailSent(orderId: number): Promise<void> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order || !orderIsPaid(order.status) || !order.stripeSessionId) {
    return;
  }

  if (!isResendConfigured()) {
    return;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    if (session.metadata?.[CONFIRMATION_EMAIL_SENT] === "true") {
      return;
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    let shipping = shippingFromOrder(order);
    if (!shipping?.line1) {
      const synced = await syncOrderShippingFromStripe(order.id);
      if (synced?.shippingAddress?.line1) {
        shipping = {
          name: synced.shippingAddress.name,
          line1: synced.shippingAddress.line1,
          line2: synced.shippingAddress.line2,
          city: synced.shippingAddress.city,
          postalCode: synced.shippingAddress.postalCode,
          country: synced.shippingAddress.country,
        };
      }
    }

    const sent = await maybeSendOrderConfirmationEmail(order, items, session, shipping);
    if (sent) {
      logger.info({ orderId: order.id, email: order.email }, "Email de confirmation envoyé");
    }
  } catch (error) {
    logger.error({ err: error, orderId }, "Impossible d'envoyer l'email de confirmation");
  }
}

export async function syncOrderShippingFromStripe(orderId: number): Promise<OrderResponse | null> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  if (orderHasShipping(order) || !order.stripeSessionId || !isStripeConfigured()) {
    return getOrderWithItems(orderId);
  }

  const keyMismatch = describeStripeKeyMismatch(order.stripeSessionId);
  if (keyMismatch) {
    logger.error({ orderId: order.id, stripeSessionId: order.stripeSessionId }, keyMismatch);
    return getOrderWithItems(orderId);
  }

  try {
    const stripe = getStripe();
    const { session, shipping } = await resolveShippingFromCheckoutSession(stripe, order.stripeSessionId);
    const paymentIntentId = getPaymentIntentIdFromSession(session);

    if (!shipping?.line1) {
      logger.warn(
        { orderId: order.id, stripeSessionId: order.stripeSessionId },
        "Impossible de récupérer l'adresse Stripe pour cette commande",
      );
      if (paymentIntentId && !order.stripePaymentIntentId) {
        await db
          .update(ordersTable)
          .set({ stripePaymentIntentId: paymentIntentId })
          .where(eq(ordersTable.id, order.id));
      }
      return getOrderWithItems(orderId);
    }

    await applyShippingToOrder(order.id, shipping, paymentIntentId);
    logger.info({ orderId: order.id }, "Adresse de livraison synchronisée depuis Stripe");
    return getOrderWithItems(orderId);
  } catch (error) {
    const mismatch = describeStripeKeyMismatch(order.stripeSessionId);
    if (mismatch) {
      logger.error({ orderId: order.id, stripeSessionId: order.stripeSessionId, err: error }, mismatch);
    } else {
      logger.error({ err: error, orderId: order.id }, "Échec synchronisation adresse Stripe");
    }
    return getOrderWithItems(orderId);
  }
}

export async function syncMissingOrdersShippingFromStripe(orderIds: number[]): Promise<void> {
  const uniqueIds = [...new Set(orderIds)].slice(0, 25);
  for (const orderId of uniqueIds) {
    await syncOrderShippingFromStripe(orderId);
  }
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

  if (!orderHasShipping(order)) {
    await syncOrderShippingFromStripe(order.id);
  }

  if (orderIsPaid(order.status)) {
    await ensureOrderConfirmationEmailSent(order.id);
  }

  return getOrderWithItems(order.id);
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
  resolvedShipping?: ExtractedShipping | null,
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

  const shipping = resolvedShipping ?? extractShippingFromCheckoutSession(stripeSession);
  const paymentIntentId = getPaymentIntentIdFromSession(stripeSession);

  if (order.status === "paid") {
    if (!orderHasShipping(order) && shipping?.line1) {
      await applyShippingToOrder(order.id, shipping, paymentIntentId);
      logger.info({ orderId: order.id }, "Adresse de livraison récupérée pour commande déjà payée");
    }
    const synced = await syncOrderShippingFromStripe(order.id);
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));
    await maybeSendOrderConfirmationEmail(
      order,
      items,
      stripeSession,
      synced?.shippingAddress?.line1
        ? {
            name: synced.shippingAddress.name,
            line1: synced.shippingAddress.line1,
            line2: synced.shippingAddress.line2,
            city: synced.shippingAddress.city,
            postalCode: synced.shippingAddress.postalCode,
            country: synced.shippingAddress.country,
          }
        : shipping,
    );
    return synced ?? getOrderWithItems(order.id);
  }

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

  const synced = await syncOrderShippingFromStripe(order.id);
  await maybeSendOrderConfirmationEmail(
    order,
    items,
    stripeSession,
    synced?.shippingAddress?.line1
      ? {
          name: synced.shippingAddress.name,
          line1: synced.shippingAddress.line1,
          line2: synced.shippingAddress.line2,
          city: synced.shippingAddress.city,
          postalCode: synced.shippingAddress.postalCode,
          country: synced.shippingAddress.country,
        }
      : shipping,
  );

  return synced ?? getOrderWithItems(order.id);
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
