import webpush from "web-push";
import { eq } from "drizzle-orm";
import { adminPushSubscriptionsTable, db, type Order } from "@workspace/db";
import { logger } from "./logger";

let vapidConfigured = false;

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() ?? null;
}

function ensureVapidConfigured(): void {
  if (vapidConfigured || !isPushConfigured()) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() ?? "mailto:contact@davilla-rondeur.fr",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidConfigured = true;
}

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function saveAdminPushSubscription(
  adminEmail: string,
  subscription: PushSubscriptionInput,
  userAgent?: string | null,
): Promise<void> {
  await db
    .insert(adminPushSubscriptionsTable)
    .values({
      adminEmail: adminEmail.toLowerCase(),
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: adminPushSubscriptionsTable.endpoint,
      set: {
        adminEmail: adminEmail.toLowerCase(),
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
    });
}

export async function removeAdminPushSubscription(endpoint: string): Promise<void> {
  await db.delete(adminPushSubscriptionsTable).where(eq(adminPushSubscriptionsTable.endpoint, endpoint));
}

export async function countAdminPushSubscriptions(adminEmail: string): Promise<number> {
  const rows = await db
    .select({ id: adminPushSubscriptionsTable.id })
    .from(adminPushSubscriptionsTable)
    .where(eq(adminPushSubscriptionsTable.adminEmail, adminEmail.toLowerCase()));
  return rows.length;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

export async function notifyAdminsNewOrder(order: Order, itemCount: number): Promise<void> {
  if (!isPushConfigured()) {
    logger.debug({ orderId: order.id }, "Push admin ignoré — VAPID non configuré");
    return;
  }

  ensureVapidConfigured();

  const subscriptions = await db.select().from(adminPushSubscriptionsTable);
  if (!subscriptions.length) {
    return;
  }

  const total = parseFloat(order.total);
  const payload = JSON.stringify({
    type: "NEW_ORDER",
    orderId: order.id,
    title: `Nouvelle commande #${order.id}`,
    body: `${formatEuro(total)} · ${order.email}${itemCount > 0 ? ` · ${itemCount} article${itemCount > 1 ? "s" : ""}` : ""}`,
    url: `/orders`,
    tag: `order-${order.id}`,
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
      } catch (error) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode: number }).statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await removeAdminPushSubscription(subscription.endpoint);
          logger.info({ endpoint: subscription.endpoint }, "Abonnement push expiré supprimé");
          return;
        }

        logger.warn({ err: error, orderId: order.id }, "Échec envoi push admin");
      }
    }),
  );
}
