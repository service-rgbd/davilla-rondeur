export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function subscriptionUsesPublicKey(subscription: PushSubscription, publicKey: string): boolean {
  const existingKey = subscription.options?.applicationServerKey;
  if (!existingKey) return false;

  const expected = urlBase64ToUint8Array(publicKey);
  let actual: Uint8Array;
  if (existingKey instanceof Uint8Array) {
    actual = existingKey;
  } else if (existingKey instanceof ArrayBuffer) {
    actual = new Uint8Array(existingKey);
  } else {
    const view = existingKey as ArrayBufferView;
    actual = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }

  if (actual.length !== expected.length) return false;
  return expected.every((byte, index) => actual[index] === byte);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/** Sur iOS, les push Web ne fonctionnent que via l'app installée (écran d'accueil). */
export function needsIosPwaInstall(): boolean {
  return isIosDevice() && !isStandalonePwa();
}

export async function getPortailServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready;
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getPortailServiceWorkerRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function subscribeToAdminPush(publicKey: string): Promise<PushSubscription> {
  const registration = await getPortailServiceWorkerRegistration();
  if (!registration) {
    throw new Error("Service worker indisponible");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission de notification refusée");
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing && subscriptionUsesPublicKey(existing, publicKey)) {
    return existing;
  }

  if (existing) {
    await existing.unsubscribe();
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
}

export async function unsubscribeFromAdminPush(): Promise<PushSubscription | null> {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription;
}

export function subscriptionToPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Abonnement push invalide");
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
}
