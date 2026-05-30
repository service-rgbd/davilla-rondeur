import { useCallback, useEffect, useState } from "react";
import {
  useAdminGetPushStatus,
  useAdminGetPushVapidKey,
  useAdminSendPushTest,
  useAdminSubscribePush,
  useAdminUnsubscribePush,
} from "@workspace/api-client-react";
import {
  getExistingPushSubscription,
  isPushSupported,
  needsIosPwaInstall,
  subscribeToAdminPush,
  subscriptionToPayload,
  unsubscribeFromAdminPush,
} from "@/lib/portail-pwa";

export function useAdminPush() {
  const supported = isPushSupported();
  const iosNeedsPwa = needsIosPwaInstall();
  const [localEndpoint, setLocalEndpoint] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);

  useEffect(() => {
    if (!supported) {
      setLocalReady(true);
      return;
    }

    let cancelled = false;
    void getExistingPushSubscription()
      .then((subscription) => {
        if (!cancelled) {
          setLocalEndpoint(subscription?.endpoint ?? null);
          setLocalReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocalEndpoint(null);
          setLocalReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supported]);

  const { data: status, refetch: refetchStatus, isLoading: statusLoading } = useAdminGetPushStatus(
    localEndpoint ? { endpoint: localEndpoint } : undefined,
    {
      query: {
        enabled: supported && localReady,
        staleTime: 60_000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
  );

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
  const testMutation = useAdminSendPushTest();

  const refreshLocalEndpoint = useCallback(async () => {
    const subscription = await getExistingPushSubscription();
    setLocalEndpoint(subscription?.endpoint ?? null);
  }, []);

  const enable = useCallback(async () => {
    if (iosNeedsPwa) {
      throw new Error(
        "Sur iPhone/iPad, installez d'abord le portail sur l'écran d'accueil (Partager → Sur l'écran d'accueil), puis rouvrez l'app depuis l'icône.",
      );
    }

    if (!vapidKey?.publicKey) {
      throw new Error("Notifications push non configurées sur le serveur");
    }

    const subscription = await subscribeToAdminPush(vapidKey.publicKey);
    await subscribeMutation.mutateAsync({ data: subscriptionToPayload(subscription) });
    setLocalEndpoint(subscription.endpoint);
    await refetchStatus();
  }, [iosNeedsPwa, refetchStatus, subscribeMutation, vapidKey?.publicKey]);

  const disable = useCallback(async () => {
    const subscription = await getExistingPushSubscription();
    if (subscription) {
      await unsubscribeMutation.mutateAsync({ data: { endpoint: subscription.endpoint } });
      await unsubscribeFromAdminPush();
    }
    setLocalEndpoint(null);
    await refetchStatus();
  }, [refetchStatus, unsubscribeMutation]);

  const sendTest = useCallback(async () => {
    if (iosNeedsPwa) {
      throw new Error(
        "Sur iPhone/iPad, ouvrez le portail depuis l'icône installée sur l'écran d'accueil, pas depuis Safari.",
      );
    }

    const subscription = await getExistingPushSubscription();
    if (!subscription) {
      throw new Error("Activez d'abord les notifications sur cet appareil, puis réessayez.");
    }

    const result = await testMutation.mutateAsync({
      data: { endpoint: subscription.endpoint },
    });
    return result;
  }, [iosNeedsPwa, testMutation]);

  const subscribedOnThisDevice = Boolean(localEndpoint);
  const accountHasDevices = (status?.deviceCount ?? 0) > 0;

  return {
    supported,
    iosNeedsPwa,
    configured: status?.configured ?? false,
    subscribed: subscribedOnThisDevice,
    accountHasDevices,
    deviceCount: status?.deviceCount ?? 0,
    localEndpoint,
    statusLoading: !localReady || statusLoading,
    enable,
    disable,
    sendTest,
    refreshLocalEndpoint,
    isEnabling: subscribeMutation.isPending,
    isDisabling: unsubscribeMutation.isPending,
    isTesting: testMutation.isPending,
  };
}
