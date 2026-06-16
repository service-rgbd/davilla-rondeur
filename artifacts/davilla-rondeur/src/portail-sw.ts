/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

type PushPayload = {
  type?: string;
  orderId?: number;
  reviewId?: number;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

function defaultPushTitle(type?: string): string {
  if (type === "NEW_REVIEW") return "Nouvel avis client";
  if (type === "PUSH_TEST") return "Test Davilla Rondeur";
  return "Nouvelle commande";
}

function defaultPushBody(type?: string): string {
  if (type === "NEW_REVIEW") return "Un client a laissé un avis en attente de validation.";
  return "Une commande vient d'être payée.";
}

function parsePushPayload(event: PushEvent): PushPayload {
  try {
    return (event.data?.json() as PushPayload | undefined) ?? {};
  } catch {
    const text = event.data?.text();
    return text ? { body: text, title: "Davilla Rondeur" } : {};
  }
}

async function notifyClients(payload: PushPayload): Promise<void> {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({
      type: payload.type ?? "NEW_ORDER",
      orderId: payload.orderId,
      reviewId: payload.reviewId,
      url: payload.url,
    });
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event as PushEvent);

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title ?? defaultPushTitle(payload.type), {
        body: payload.body ?? defaultPushBody(payload.type),
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        tag: payload.tag ?? (payload.type === "NEW_REVIEW" ? "new-review" : "new-order"),
        data: { url: payload.url ?? (payload.type === "NEW_REVIEW" ? "/reviews" : "/orders") },
      });
      await notifyClients(payload);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string | undefined) ?? "/orders";

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windowClients) {
        if ("focus" in client) {
          await client.focus();
          client.postMessage({ type: "OPEN_ADMIN", url: targetUrl });
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
