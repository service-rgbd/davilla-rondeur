import { useState } from "react";
import { Link } from "wouter";
import {
  useAdminGetOrder,
  useAdminListOrders,
  useAdminUpdateOrder,
  getAdminListOrdersQueryKey,
  getAdminGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  OrderStatusBadge,
  ORDER_STATUS_OPTIONS,
} from "@/components/admin/order-status-badge";
import { ShippingAddressBlock, ShippingAddressInline } from "@/components/admin/shipping-address-block";
import { OrderColissimoSection } from "@/components/admin/order-colissimo-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Printer, RefreshCw, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminRoutes } from "@/lib/admin-routes";
import {
  listOrderReviews,
  publishOrderReviews,
  type AdminProductReview,
} from "@/lib/product-reviews-api";
import { formatDateTime, formatEuro, shippingFromSummary } from "@/lib/format-order";
import { PORTAIL_CACHE } from "@/lib/portail-query-client";

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payées" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
] as const;

function AdminReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-3.5 w-3.5 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

function OrderReviewsSection({ orderId }: { orderId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", orderId, "reviews"],
    queryFn: () => listOrderReviews(orderId),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishOrderReviews(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast({ title: "Avis publiés sur la boutique" });
    },
    onError: (error: Error) => {
      toast({ title: "Publication impossible", description: error.message, variant: "destructive" });
    },
  });

  const reviews = data ?? [];
  const pendingCount = reviews.filter((r: AdminProductReview) => r.status === "pending").length;

  if (isLoading) {
    return (
      <section className="border border-border p-4 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des avis…
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="border border-border p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Avis clients</p>
        <p className="text-sm text-muted-foreground">Aucun avis laissé pour cette commande.</p>
      </section>
    );
  }

  return (
    <section className="border border-border overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Avis clients</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} en attente de validation`
              : "Tous les avis sont publiés ou refusés"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-none text-xs uppercase tracking-widest" asChild>
            <Link href={adminRoutes.reviews}>Voir tous les avis</Link>
          </Button>
          {pendingCount > 0 ? (
            <Button
              size="sm"
              className="rounded-none text-xs uppercase tracking-widest"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Publier les avis ({pendingCount})
            </Button>
          ) : null}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {reviews.map((review: AdminProductReview) => (
          <li key={review.id} className="p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{review.productName ?? `Produit #${review.productId}`}</p>
                <p className="text-xs text-muted-foreground">{review.authorName}</p>
              </div>
              <Badge variant={review.status === "published" ? "default" : review.status === "pending" ? "secondary" : "outline"}>
                {review.status === "published" ? "Publié" : review.status === "pending" ? "En attente" : "Refusé"}
              </Badge>
            </div>
            <AdminReviewStars rating={review.rating} />
            {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: order, isLoading, refetch, isFetching } = useAdminGetOrder(orderId ?? 0, {
    query: {
      enabled: open && orderId != null,
      staleTime: PORTAIL_CACHE.orderDetail,
      refetchOnMount: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial query options merged by orval
    } as any,
  });
  const updateMutation = useAdminUpdateOrder();

  const handleStatusChange = (status: string) => {
    if (!orderId) return;
    updateMutation.mutate(
      { id: orderId, data: { status: status as "pending" | "paid" | "shipped" | "delivered" | "cancelled" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getAdminGetDashboardStatsQueryKey() });
          toast({ title: "Statut mis à jour" });
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans">
            Commande {orderId ? `#${orderId}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading || isFetching || !order ? (
          <div className="h-40 animate-pulse bg-muted" />
        ) : (
          <div className="space-y-6 font-sans text-sm">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:justify-between">
              <OrderStatusBadge status={order.status} />
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none h-10 font-sans text-xs uppercase tracking-widest"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser Stripe
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none h-10 font-sans text-xs uppercase tracking-widest"
                  onClick={() => window.open(adminRoutes.orderPrint(order.id), "_blank", "noopener")}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Select value={order.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
                  <SelectTrigger className="w-full sm:w-48 rounded-none h-10">
                    <SelectValue placeholder="Changer le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <section className="border border-border p-4 space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Client</p>
                <p className="font-medium">{order.email}</p>
                {order.shippingAddress?.phone ? (
                  <p className="text-muted-foreground">Tél. {order.shippingAddress.phone}</p>
                ) : null}
                <p className="text-xs text-muted-foreground pt-1">
                  Créée le {formatDateTime(order.createdAt)}
                  {order.paidAt ? ` · Payée le ${formatDateTime(order.paidAt)}` : ""}
                </p>
              </section>

              <section className="border border-border p-4 space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Montants</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatEuro(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{order.shippingAmount === 0 ? "Offerte" : formatEuro(order.shippingAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
                    <span>Total TTC</span>
                    <span>{formatEuro(order.total)}</span>
                  </div>
                </div>
              </section>
            </div>

            <section className="border border-border p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Adresse de livraison
              </p>
              <ShippingAddressBlock shipping={order.shippingAddress} fallbackEmail={order.email} />
            </section>

            <section className="border border-border overflow-hidden">
              <p className="text-xs uppercase tracking-widest text-muted-foreground px-4 py-3 bg-muted/40 border-b border-border">
                Articles commandés
              </p>
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-left p-3 text-xs uppercase tracking-widest">Produit</th>
                    <th className="text-left p-3 text-xs uppercase tracking-widest">Qté</th>
                    <th className="text-right p-3 text-xs uppercase tracking-widest">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3">
                        <p>{item.productName}</p>
                        {item.size || item.color ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[item.size, item.color].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3 text-right">{formatEuro(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <OrderColissimoSection
              order={order as typeof order & {
                trackingNumber?: string | null;
                carrier?: string | null;
                colissimoLabelUrl?: string | null;
                packageWeightGrams?: number | null;
                shippedAt?: string | null;
              }}
              onUpdated={() => {
                void refetch();
                queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() });
              }}
            />

            {orderId != null ? <OrderReviewsSection orderId={orderId} /> : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrdersTable({ status }: { status: string }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: orders, isLoading, isFetching } = useAdminListOrders(
    status === "all" ? {} : { status: status as "pending" | "paid" | "shipped" | "delivered" | "cancelled" },
  );

  const showLoading = isLoading || (status === "pending" && isFetching && !orders?.length);

  if (showLoading) {
    return <div className="h-48 animate-pulse bg-muted border border-border" />;
  }

  if (!orders?.length) {
    return (
      <div className="border border-border p-12 text-center font-sans text-sm text-muted-foreground">
        Aucune commande dans cette catégorie
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {orders.map((order) => {
          const shipping = shippingFromSummary(order);
          return (
            <div key={order.id} className="border border-border p-4 space-y-3 bg-background">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans font-semibold">#{order.id}</p>
                  <p className="font-sans text-sm break-all">{order.email}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="font-sans text-sm space-y-1">
                <p className="font-medium">{formatEuro(order.total)}</p>
                <p className="text-muted-foreground text-xs">
                  <ShippingAddressInline shipping={shipping} />
                </p>
                <p className="text-muted-foreground text-xs">
                  {order.paidAt ? `Payée ${formatDateTime(order.paidAt)}` : `Créée ${formatDateTime(order.createdAt)}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none w-full"
                onClick={() => setSelectedId(order.id)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir le détail
              </Button>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block border border-border overflow-x-auto">
        <table className="w-full font-sans text-sm min-w-[960px]">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">#</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Client</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Livraison</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Statut</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Total</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Payée le</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const shipping = shippingFromSummary(order);
              return (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 align-top">
                  <td className="p-4 font-medium">#{order.id}</td>
                  <td className="p-4">
                    <p>{order.email}</p>
                    {order.shippingPhone ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{order.shippingPhone}</p>
                    ) : null}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground max-w-xs">
                    <ShippingAddressInline shipping={shipping} />
                  </td>
                  <td className="p-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="p-4 font-medium">{formatEuro(order.total)}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {order.paidAt ? formatDateTime(order.paidAt) : "—"}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={() => setSelectedId(order.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <OrderDetailDialog
        orderId={selectedId}
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}

export default function AdminOrders() {
  const [tab, setTab] = useState("paid");

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">Commandes</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Synchronisées avec Stripe à chaque consultation — montants, adresses et statuts de paiement
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-none h-auto flex w-full overflow-x-auto flex-nowrap gap-1 bg-muted/40 p-1 mb-6 scrollbar-thin">
          {FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="rounded-none shrink-0 font-sans text-xs uppercase tracking-widest data-[state=active]:bg-background"
            >
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FILTERS.map((filter) => (
          <TabsContent key={filter.value} value={filter.value}>
            <OrdersTable status={filter.value} />
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
}
