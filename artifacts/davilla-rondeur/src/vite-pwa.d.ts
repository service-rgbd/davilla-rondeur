declare module "workbox-precaching" {
  export function precacheAndRoute(entries: unknown): void;
  export function cleanupOutdatedCaches(): void;
}

interface ServiceWorkerGlobalScope {
  __WB_MANIFEST: unknown;
}

declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
