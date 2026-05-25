import { useState } from "react";
import {
  useAdminGetOrder,
  useAdminListOrders,
  useAdminUpdateOrder,
  getAdminListOrdersQueryKey,
  getAdminGetDashboardStatsQueryKey,
  getAdminGetOrderQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  OrderStatusBadge,
  ORDER_STATUS_OPTIONS,
} from "@/components/admin/order-status-badge";
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
import { useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payées" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
] as const;

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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
  const { data: order, isLoading } = useAdminGetOrder(orderId ?? 0, {
    query: {
      enabled: open && orderId != null,
      queryKey: getAdminGetOrderQueryKey(orderId ?? 0),
    },
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
      <DialogContent className="rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans">
            Commande {orderId ? `#${orderId}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="h-40 animate-pulse bg-muted" />
        ) : (
          <div className="space-y-6 font-sans text-sm">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <OrderStatusBadge status={order.status} />
              <Select value={order.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
                <SelectTrigger className="w-48 rounded-none h-10">
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-border p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div className="border border-border p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total</p>
                <p className="font-medium text-lg">{formatEuro(order.total)}</p>
              </div>
            </div>

            {order.shippingAddress ? (
              <div className="border border-border p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Adresse de livraison</p>
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                <p>
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : null}

            <div className="border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3 text-xs uppercase tracking-widest">Produit</th>
                    <th className="text-left p-3 text-xs uppercase tracking-widest">Qté</th>
                    <th className="text-right p-3 text-xs uppercase tracking-widest">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="p-3">{item.productName}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3 text-right">{formatEuro(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Créée le {formatDate(order.createdAt)}</p>
              {order.paidAt ? <p>Payée le {formatDate(order.paidAt)}</p> : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrdersTable({ status }: { status: string }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: orders, isLoading } = useAdminListOrders(
    status === "all" ? {} : { status: status as "pending" | "paid" | "shipped" | "delivered" | "cancelled" },
  );

  if (isLoading) {
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
      <div className="border border-border overflow-x-auto">
        <table className="w-full font-sans text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">#</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Client</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Statut</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Articles</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Total</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Date</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="p-4 font-medium">#{order.id}</td>
                <td className="p-4">
                  <p>{order.email}</p>
                  {order.shippingCity ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.shippingCity}
                      {order.shippingCountry ? `, ${order.shippingCountry}` : ""}
                    </p>
                  ) : null}
                </td>
                <td className="p-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-4">{order.itemCount}</td>
                <td className="p-4 font-medium">{formatEuro(order.total)}</td>
                <td className="p-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
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
            ))}
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
  const [tab, setTab] = useState("all");

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-sans font-bold tracking-tight">Commandes</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Suivez les commandes en attente, payées, expédiées et livrées
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-none h-auto flex-wrap gap-1 bg-muted/40 p-1 mb-6">
          {FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="rounded-none font-sans text-xs uppercase tracking-widest data-[state=active]:bg-background"
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
