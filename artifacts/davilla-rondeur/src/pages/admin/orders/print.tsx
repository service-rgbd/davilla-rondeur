import { useEffect } from "react";
import { useRoute } from "wouter";
import { useAdminGetOrder, getAdminGetOrderQueryKey } from "@workspace/api-client-react";
import { OrderPrintSheet } from "@/components/admin/order-print-sheet";
import { adminRoutes } from "@/lib/admin-routes";
import { Link } from "wouter";

export default function AdminOrderPrintPage() {
  const [, params] = useRoute(`${adminRoutes.orders}/:id/print`);
  const orderId = Number.parseInt(params?.id ?? "", 10);

  const { data: order, isLoading, isError } = useAdminGetOrder(orderId, {
    query: {
      enabled: Number.isFinite(orderId) && orderId > 0,
      queryKey: getAdminGetOrderQueryKey(orderId),
    },
  });

  useEffect(() => {
    if (!order || isLoading) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [order, isLoading]);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <div className="order-print-page-shell p-8 font-sans">
        <p>Commande invalide.</p>
        <Link href={adminRoutes.orders}>Retour aux commandes</Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="order-print-page-shell p-8 font-sans animate-pulse">Chargement…</div>;
  }

  if (isError || !order) {
    return (
      <div className="order-print-page-shell p-8 font-sans">
        <p>Commande introuvable.</p>
        <Link href={adminRoutes.orders}>Retour aux commandes</Link>
      </div>
    );
  }

  return (
    <div className="order-print-page-shell">
      <div className="order-print-toolbar no-print">
        <Link href={adminRoutes.orders} className="text-sm underline">
          ← Commandes
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-sm font-medium px-4 py-2 border border-foreground"
        >
          Imprimer
        </button>
      </div>
      <OrderPrintSheet order={order} />
    </div>
  );
}
