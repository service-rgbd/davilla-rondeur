import { QueryClient } from "@tanstack/react-query";
import {
  getAdminGetDashboardStatsQueryKey,
  getAdminGetTwoFactorStatusQueryKey,
  getAdminListCustomersQueryKey,
  getAdminListNewsletterSubscribersQueryKey,
  getAdminListOrdersQueryKey,
  getAdminListProductsQueryKey,
} from "@workspace/api-client-react";

const MINUTE = 60_000;

export const PORTAIL_CACHE = {
  dashboard: 2 * MINUTE,
  products: 3 * MINUTE,
  customers: 2 * MINUTE,
  newsletter: 2 * MINUTE,
  twoFactor: 5 * MINUTE,
  ordersHistorical: 3 * MINUTE,
  orderDetail: 45_000,
  ordersAll: 30_000,
} as const;

/** Commandes entrantes — toujours fraîches, pas de cache long. */
export const INCOMING_ORDERS_QUERY = {
  staleTime: 0,
  gcTime: 30_000,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
} as const;

export function createPortailQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: MINUTE,
        gcTime: 10 * MINUTE,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });

  client.setQueryDefaults(getAdminGetDashboardStatsQueryKey(), {
    staleTime: PORTAIL_CACHE.dashboard,
  });

  client.setQueryDefaults(getAdminListProductsQueryKey(), {
    staleTime: PORTAIL_CACHE.products,
  });

  client.setQueryDefaults(getAdminListCustomersQueryKey(), {
    staleTime: PORTAIL_CACHE.customers,
  });

  client.setQueryDefaults(getAdminListNewsletterSubscribersQueryKey(), {
    staleTime: PORTAIL_CACHE.newsletter,
  });

  client.setQueryDefaults(getAdminGetTwoFactorStatusQueryKey(), {
    staleTime: PORTAIL_CACHE.twoFactor,
  });

  for (const status of ["paid", "shipped", "delivered", "cancelled"] as const) {
    client.setQueryDefaults(getAdminListOrdersQueryKey({ status }), {
      staleTime: PORTAIL_CACHE.ordersHistorical,
    });
  }

  client.setQueryDefaults(getAdminListOrdersQueryKey(), {
    staleTime: PORTAIL_CACHE.ordersHistorical,
  });

  client.setQueryDefaults(getAdminListOrdersQueryKey({ status: "pending" }), {
    ...INCOMING_ORDERS_QUERY,
  });

  client.setQueryDefaults(getAdminListOrdersQueryKey({ status: "all" }), {
    staleTime: PORTAIL_CACHE.ordersAll,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });

  return client;
}

export function invalidateIncomingOrders(client: QueryClient): void {
  void client.invalidateQueries({ queryKey: getAdminListOrdersQueryKey({ status: "pending" }) });
  void client.invalidateQueries({ queryKey: getAdminListOrdersQueryKey({ status: "all" }) });
  void client.invalidateQueries({ queryKey: getAdminGetDashboardStatsQueryKey() });
}

export function invalidateAdminReviews(client: QueryClient): void {
  void client.invalidateQueries({ queryKey: ["admin-reviews"] });
  void client.invalidateQueries({ queryKey: ["admin", "orders"] });
}
