import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { TwoFactorPromptDialog } from "@/components/admin/two-factor-prompt-dialog";
import { useAdminPush } from "@/hooks/use-admin-push";
import { invalidateIncomingOrders } from "@/lib/portail-query-client";
import { adminRoutes } from "@/lib/admin-routes";

/** Services portail : push SW, invalidation cache commandes entrantes, invite 2FA. */
export function PortailServices() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const pushAttempted = useRef(false);
  const { supported, configured, subscribed, enable, iosNeedsPwa } = useAdminPush();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "NEW_ORDER") {
        invalidateIncomingOrders(queryClient);
      }
      if (event.data?.type === "OPEN_ORDERS") {
        setLocation(event.data.url ?? adminRoutes.orders);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [queryClient, setLocation]);

  useEffect(() => {
    if (
      pushAttempted.current ||
      !supported ||
      !configured ||
      subscribed ||
      iosNeedsPwa ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    pushAttempted.current = true;
    void enable().catch(() => {
      pushAttempted.current = false;
    });
  }, [configured, enable, iosNeedsPwa, subscribed, supported]);

  return <TwoFactorPromptDialog />;
}
