import { and, desc, eq, isNotNull } from "drizzle-orm";
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
import { notifyAdminsNewOrder } from "./admin-push";
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
    phone: string | null;
  } | null;
  stripeSessionId: string | null;
  createdAt: Date;
  paidAt: Date | null;
  trackingNumber: string | null;
  carrier: string | null;
  colissimoLabelUrl: string | null;
  packageWeightGrams: number | null;
  shippedAt: Date | null;
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
          phone: order.shippingPhone,
        }
      : null,
    stripeSessionId: order.stripeSessionId,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    colissimoLabelUrl: order.colissimoLabelUrl,
    packageWeightGrams: order.packageWeightGrams,
    shippedAt: order.shippedAt,
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

export function orderNeedsStripeReconcile(order: Order): boolean {
  if (!order.stripeSessionId || !isStripeConfigured()) {
    return false;
  }

  if (order.status === "pending") {
    return true;
  }

  if (!orderIsPaid(order.status)) {
    return false;
  }

  return (
    !orderHasShipping(order) ||
    !order.stripePaymentIntentId ||
    !order.paidAt
  );
}

type ReconcileOrderOptions = {
  stripeSession?: Stripe.Checkout.Session;
  resolvedShipping?: ExtractedShipping | null;
};

export async function reconcileOrderWithStripe(
  orderId: number,
  options: ReconcileOrderOptions = {},
): Promise<OrderResponse | null> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  if (!order.stripeSessionId || !isStripeConfigured()) {
    return getOrderWithItems(orderId);
  }

  const keyMismatch = describeStripeKeyMismatch(order.stripeSessionId);
  if (keyMismatch) {
    logger.error({ orderId: order.id, stripeSessionId: order.stripeSessionId }, keyMismatch);
    return getOrderWithItems(orderId);
  }

  try {
    const stripe = getStripe();
    let session = options.stripeSession;
    let shipping = options.resolvedShipping ?? null;

    if (!session) {
      const resolved = await resolveShippingFromCheckoutSession(stripe, order.stripeSessionId);
      session = resolved.session;
      shipping = shipping ?? resolved.shipping;
    } else if (!shipping) {
      shipping = extractShippingFromCheckoutSession(session);
    }

    const paymentIntentId = getPaymentIntentIdFromSession(session);
    const sessionPaid = session.payment_status === "paid" && session.status === "complete";
    const becamePaid = order.status === "pending" && sessionPaid;
    const customerEmail = session.customer_details?.email?.trim();
    const customerPhone = session.customer_details?.phone?.trim() ?? null;

    const patch: Partial<Order> = {};

    if (sessionPaid && order.status === "pending") {
      patch.status = "paid";
      patch.paidAt = new Date();
    } else if (sessionPaid && orderIsPaid(order.status) && !order.paidAt) {
      patch.paidAt = new Date(session.created * 1000);
    }

    if (paymentIntentId) {
      patch.stripePaymentIntentId = paymentIntentId;
    }

    if (customerEmail && customerEmail !== order.email) {
      patch.email = customerEmail;
    }

    if (customerPhone) {
      patch.shippingPhone = customerPhone;
    }

    if (shipping?.line1) {
      patch.shippingName = shipping.name;
      patch.shippingLine1 = shipping.line1;
      patch.shippingLine2 = shipping.line2;
      patch.shippingCity = shipping.city;
      patch.shippingPostalCode = shipping.postalCode;
      patch.shippingCountry = shipping.country;
    }

    if (Object.keys(patch).length > 0) {
      await db.update(ordersTable).set(patch).where(eq(ordersTable.id, orderId));
    }

    if (order.status === "pending" && sessionPaid && order.sessionId) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, order.sessionId));
    }

    const [updated] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));

    if (updated && orderIsPaid(updated.status)) {
      await ensureOrderConfirmationEmailSent(orderId);
    }

    if (becamePaid && updated) {
      const items = await db
        .select({ id: orderItemsTable.id })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, orderId));
      void notifyAdminsNewOrder(updated, items.length).catch((error) => {
        logger.warn({ err: error, orderId }, "Notification push admin échouée");
      });
    }

    logger.info(
      {
        orderId,
        sessionPaid,
        hasShipping: Boolean(shipping?.line1 || updated?.shippingLine1),
      },
      "Commande synchronisée avec Stripe",
    );

    return getOrderWithItems(orderId);
  } catch (error) {
    const mismatch = describeStripeKeyMismatch(order.stripeSessionId);
    if (mismatch) {
      logger.error({ orderId: order.id, stripeSessionId: order.stripeSessionId, err: error }, mismatch);
    } else {
      logger.error({ err: error, orderId: order.id }, "Échec synchronisation commande Stripe");
    }
    return getOrderWithItems(orderId);
  }
}

export async function syncOrderShippingFromStripe(orderId: number): Promise<OrderResponse | null> {
  return reconcileOrderWithStripe(orderId);
}

export async function reconcileOrdersWithStripe(orderIds: number[]): Promise<void> {
  const uniqueIds = [...new Set(orderIds)].slice(0, 30);
  await Promise.all(uniqueIds.map((orderId) => reconcileOrderWithStripe(orderId)));
}

export async function reconcileRecentPendingOrders(limit = 5): Promise<void> {
  if (!isStripeConfigured()) return;

  const pending = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(and(eq(ordersTable.status, "pending"), isNotNull(ordersTable.stripeSessionId)))
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);

  if (pending.length === 0) return;
  await reconcileOrdersWithStripe(pending.map((row) => row.id));
}

/** Réconciliation Stripe non bloquante (tableau de bord, liste « toutes »). */
export function scheduleRecentPendingReconcile(limit = 5): void {
  void reconcileRecentPendingOrders(limit).catch((error) => {
    logger.warn({ err: error }, "Réconciliation Stripe en arrière-plan échouée");
  });
}

/** @deprecated Utiliser reconcileOrdersWithStripe */
export async function syncMissingOrdersShippingFromStripe(orderIds: number[]): Promise<void> {
  return reconcileOrdersWithStripe(orderIds);
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
  const customerPhone = stripeSession.customer_details?.phone?.trim() ?? null;

  const sent = await sendOrderConfirmationEmail({
    orderId: order.id,
    email: recipientEmail,
    total: parseFloat(order.total),
    items: items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: parseFloat(item.price),
    })),
    shippingAddress:
      shipping?.line1 ?
        { ...shipping, phone: order.shippingPhone ?? customerPhone }
      : null,
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

    const sent = await maybeSendOrderConfirmationEmail(order, items, session, shipping);
    if (sent) {
      logger.info({ orderId: order.id, email: order.email }, "Email de confirmation envoyé");
    }
  } catch (error) {
    logger.error({ err: error, orderId }, "Impossible d'envoyer l'email de confirmation");
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

  return reconcileOrderWithStripe(order.id);
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

  return reconcileOrderWithStripe(orderId, { stripeSession, resolvedShipping });
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
