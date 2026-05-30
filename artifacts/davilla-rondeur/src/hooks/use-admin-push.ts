import { useCallback } from "react";
import {
  useAdminGetPushStatus,
  useAdminGetPushVapidKey,
  useAdminSubscribePush,
  useAdminUnsubscribePush,
} from "@workspace/api-client-react";
import {
  getExistingPushSubscription,
  isPushSupported,
  subscribeToAdminPush,
  subscriptionToPayload,
  unsubscribeFromAdminPush,
} from "@/lib/portail-pwa";

export function useAdminPush() {
  const supported = isPushSupported();

  const { data: status, refetch: refetchStatus, isLoading: statusLoading } = useAdminGetPushStatus({
    query: {
      enabled: supported,
      staleTime: 60_000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  const { data: vapidKey } = useAdminGetPushVapidKey({
    query: {
      enabled: supported && Boolean(status?.configured),
      staleTime: Infinity,
      retry: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  const subscribeMutation = useAdminSubscribePush();
  const unsubscribeMutation = useAdminUnsubscribePush();

  const enable = useCallback(async () => {
    if (!vapidKey?.publicKey) {
      throw new Error("Notifications push non configurées sur le serveur");
    }

    const subscription = await subscribeToAdminPush(vapidKey.publicKey);
    await subscribeMutation.mutateAsync({ data: subscriptionToPayload(subscription) });
    await refetchStatus();
  }, [refetchStatus, subscribeMutation, vapidKey?.publicKey]);

  const disable = useCallback(async () => {
    const subscription = await getExistingPushSubscription();
    if (subscription) {
      await unsubscribeMutation.mutateAsync({ data: { endpoint: subscription.endpoint } });
      await unsubscribeFromAdminPush();
    }
    await refetchStatus();
  }, [refetchStatus, unsubscribeMutation]);

  return {
    supported,
    configured: status?.configured ?? false,
    subscribed: status?.subscribed ?? false,
    deviceCount: status?.deviceCount ?? 0,
    statusLoading,
    enable,
    disable,
    isEnabling: subscribeMutation.isPending,
    isDisabling: unsubscribeMutation.isPending,
  };
}
