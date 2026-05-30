import { Router, type IRouter } from "express";
import { requireAdmin } from "../../lib/auth";
import {
  countAdminPushSubscriptions,
  getVapidPublicKey,
  isAdminPushEndpointRegistered,
  isPushConfigured,
  removeAdminPushSubscription,
  saveAdminPushSubscription,
  sendAdminPushTest,
  type PushSubscriptionInput,
} from "../../lib/admin-push";

const router: IRouter = Router();

function parsePushSubscription(body: unknown): PushSubscriptionInput | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const endpoint = record.endpoint;
  const keys = record.keys;

  if (typeof endpoint !== "string" || !endpoint.startsWith("http")) return null;
  if (!keys || typeof keys !== "object") return null;

  const keyRecord = keys as Record<string, unknown>;
  if (typeof keyRecord.p256dh !== "string" || typeof keyRecord.auth !== "string") return null;

  return {
    endpoint,
    keys: { p256dh: keyRecord.p256dh, auth: keyRecord.auth },
  };
}

function parseEndpoint(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const endpoint = (body as Record<string, unknown>).endpoint;
  return typeof endpoint === "string" && endpoint.startsWith("http") ? endpoint : null;
}

router.get("/admin/push/vapid-key", requireAdmin, (_req, res): void => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    res.status(503).json({ error: "Notifications push non configurées sur le serveur" });
    return;
  }

  res.json({ publicKey, enabled: isPushConfigured() });
});

router.get("/admin/push/status", requireAdmin, async (req, res): Promise<void> => {
  const email = req.admin!.email;
  const deviceCount = await countAdminPushSubscriptions(email);
  const endpoint =
    typeof req.query.endpoint === "string" && req.query.endpoint.startsWith("http")
      ? req.query.endpoint
      : null;

  const subscribedOnThisDevice = endpoint
    ? await isAdminPushEndpointRegistered(email, endpoint)
    : false;

  res.json({
    configured: isPushConfigured(),
    subscribed: deviceCount > 0,
    subscribedOnThisDevice,
    deviceCount,
  });
});

router.post("/admin/push/subscribe", requireAdmin, async (req, res): Promise<void> => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: "Notifications push non configurées sur le serveur" });
    return;
  }

  const subscription = parsePushSubscription(req.body);
  if (!subscription) {
    res.status(400).json({ error: "Abonnement push invalide" });
    return;
  }

  await saveAdminPushSubscription(
    req.admin!.email,
    subscription,
    req.headers["user-agent"] ?? null,
  );

  res.status(201).json({ message: "Notifications activées sur cet appareil" });
});

router.post("/admin/push/unsubscribe", requireAdmin, async (req, res): Promise<void> => {
  const endpoint = parseEndpoint(req.body);
  if (!endpoint) {
    res.status(400).json({ error: "Endpoint invalide" });
    return;
  }

  await removeAdminPushSubscription(endpoint);
  res.json({ message: "Notifications désactivées sur cet appareil" });
});

router.post("/admin/push/test", requireAdmin, async (req, res): Promise<void> => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: "Notifications push non configurées sur le serveur (VAPID)" });
    return;
  }

  const endpoint = parseEndpoint(req.body);

  try {
    const result = await sendAdminPushTest(req.admin!.email, endpoint ?? undefined);
    res.json({
      message:
        result.sent > 0
          ? `Notification test envoyée à ${result.sent} appareil${result.sent > 1 ? "s" : ""}.`
          : "Aucune notification n'a pu être délivrée.",
      sent: result.sent,
      failed: result.failed,
      deviceCount: result.deviceCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_SUBSCRIPTION") {
      res.status(400).json({
        error:
          "Aucun appareil enregistré. Activez d'abord les notifications sur cet appareil, puis réessayez.",
      });
      return;
    }

    if (error instanceof Error && error.message === "NO_DEVICE_SUBSCRIPTION") {
      res.status(400).json({
        error:
          "Cet appareil n'est pas enregistré. Activez les notifications ici, ou testez depuis l'appareil déjà abonné.",
      });
      return;
    }

    res.status(500).json({ error: "Impossible d'envoyer la notification test" });
  }
});

export default router;
