import webpush from "web-push";
import { eq, and, ne } from "drizzle-orm";
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
  const email = adminEmail.toLowerCase();

  if (userAgent) {
    await db
      .delete(adminPushSubscriptionsTable)
      .where(
        and(
          eq(adminPushSubscriptionsTable.adminEmail, email),
          eq(adminPushSubscriptionsTable.userAgent, userAgent),
          ne(adminPushSubscriptionsTable.endpoint, subscription.endpoint),
        ),
      );
  }

  await db
    .insert(adminPushSubscriptionsTable)
    .values({
      adminEmail: email,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: adminPushSubscriptionsTable.endpoint,
      set: {
        adminEmail: email,
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

export async function isAdminPushEndpointRegistered(
  adminEmail: string,
  endpoint: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: adminPushSubscriptionsTable.id })
    .from(adminPushSubscriptionsTable)
    .where(
      and(
        eq(adminPushSubscriptionsTable.endpoint, endpoint),
        eq(adminPushSubscriptionsTable.adminEmail, adminEmail.toLowerCase()),
      ),
    );
  return rows.length > 0;
}

async function getSubscriptionsForAdmin(adminEmail: string, endpoint?: string) {
  const email = adminEmail.toLowerCase();
  const rows = await db
    .select()
    .from(adminPushSubscriptionsTable)
    .where(eq(adminPushSubscriptionsTable.adminEmail, email));

  if (!endpoint) return rows;
  return rows.filter((row) => row.endpoint === endpoint);
}

type PushPayload = {
  type: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  orderId?: number;
};

async function sendPushPayload(
  subscriptions: Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!subscriptions.length) {
    return { sent: 0, failed: 0 };
  }

  ensureVapidConfigured();

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

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
          body,
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode: number }).statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await removeAdminPushSubscription(subscription.endpoint);
          logger.info({ endpoint: subscription.endpoint }, "Abonnement push expiré supprimé");
        } else {
          logger.warn({ err: error, endpoint: subscription.endpoint }, "Échec envoi push admin");
        }
      }
    }),
  );

  return { sent, failed };
}

export async function sendAdminPushTest(
  adminEmail: string,
  endpoint?: string,
): Promise<{
  sent: number;
  failed: number;
  deviceCount: number;
}> {
  if (!isPushConfigured()) {
    throw new Error("VAPID_NOT_CONFIGURED");
  }

  const subscriptions = await getSubscriptionsForAdmin(adminEmail, endpoint?.trim());
  if (!subscriptions.length) {
    throw new Error(endpoint ? "NO_DEVICE_SUBSCRIPTION" : "NO_SUBSCRIPTION");
  }

  const now = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

  const result = await sendPushPayload(subscriptions, {
    type: "PUSH_TEST",
    title: "Test Davilla Rondeur",
    body: `Notification test — ${now}. Si vous voyez ceci, les alertes commandes fonctionnent.`,
    url: "/settings",
    tag: "push-test",
  });

  logger.info({ adminEmail, ...result }, "Notification push test envoyée");

  return { ...result, deviceCount: subscriptions.length };
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
  await sendPushPayload(subscriptions, {
    type: "NEW_ORDER",
    orderId: order.id,
    title: `Nouvelle commande #${order.id}`,
    body: `${formatEuro(total)} · ${order.email}${itemCount > 0 ? ` · ${itemCount} article${itemCount > 1 ? "s" : ""}` : ""}`,
    url: `/orders`,
    tag: `order-${order.id}`,
  });
}
