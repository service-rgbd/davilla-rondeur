import { AdminLayout } from "@/components/admin/admin-layout";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { ShippingAddressInline } from "@/components/admin/shipping-address-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminGetDashboardStats } from "@workspace/api-client-react";
import { adminRoutes } from "@/lib/admin-routes";
import { formatDateTime, formatEuro, shippingFromSummary } from "@/lib/format-order";
import { Euro, ShoppingBag, Users, Clock } from "lucide-react";
import { Link } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  pending: "#d97706",
  paid: "#059669",
  shipped: "#2563eb",
  delivered: "#7c3aed",
  cancelled: "#737373",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payées",
  shipped: "Expédiées",
  delivered: "Livrées",
  cancelled: "Annulées",
};

export default function AdminDashboard() {
  const { data, isLoading } = useAdminGetDashboardStats();

  const statusChartData = data
    ? Object.entries(data.ordersByStatus).map(([key, value]) => ({
        name: STATUS_LABELS[key] ?? key,
        key,
        value,
      }))
    : [];

  const inProgress = (data?.ordersByStatus.pending ?? 0) + (data?.ordersByStatus.paid ?? 0);
  const completed =
    (data?.ordersByStatus.shipped ?? 0) +
    (data?.ordersByStatus.delivered ?? 0);

  const showSkeleton = isLoading && !data;

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">Tableau de bord</h1>
      </div>

      {showSkeleton ? (
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[240px] snap-start h-32 animate-pulse bg-muted border border-border shrink-0" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2 mb-8 snap-x snap-mandatory scrollbar-thin">
            <div className="min-w-[240px] sm:min-w-[260px] snap-start shrink-0">
              <StatCard
                title="Chiffre d'affaires"
                value={formatEuro(data.totalRevenue)}
                hint="Commandes payées, expédiées ou livrées"
                icon={Euro}
              />
            </div>
            <div className="min-w-[240px] sm:min-w-[260px] snap-start shrink-0">
              <StatCard
                title="En cours"
                value={String(inProgress)}
                hint="En attente de paiement ou à préparer"
                icon={Clock}
              />
            </div>
            <div className="min-w-[240px] sm:min-w-[260px] snap-start shrink-0">
              <StatCard
                title="Commandes terminées"
                value={String(completed)}
                hint="Expédiées et livrées"
                icon={ShoppingBag}
              />
            </div>
            <div className="min-w-[240px] sm:min-w-[260px] snap-start shrink-0">
              <StatCard
                title="Abonnés newsletter"
                value={String(data.newsletterSubscribers)}
                hint="Contacts marketing"
                icon={Users}
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3 mb-8">
            <Card className="rounded-none border-border shadow-none xl:col-span-2">
              <CardHeader>
                <CardTitle className="font-sans text-sm uppercase tracking-widest">
                  Revenus — 14 derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 sm:h-72">
                {data.revenueByDay.length === 0 ? (
                  <div className="h-full flex items-center justify-center font-sans text-sm text-muted-foreground">
                    Aucune vente enregistrée pour le moment
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                        }
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} €`} />
                      <Tooltip
                        formatter={(value: number) => [formatEuro(value), "Revenus"]}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })
                        }
                      />
                      <Bar dataKey="value" fill="#1a1a1a" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-none border-border shadow-none">
              <CardHeader>
                <CardTitle className="font-sans text-sm uppercase tracking-widest">
                  Répartition des commandes
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "#a3a3a3"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {statusChartData.map((item) => (
                    <div key={item.key} className="flex items-center gap-2 font-sans text-xs">
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[item.key] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-sans text-sm uppercase tracking-widest">
                Dernières commandes
              </CardTitle>
              <Link
                href={adminRoutes.orders}
                className="font-sans text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Voir tout →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="md:hidden space-y-3">
                {data.recentOrders.map((order) => {
                  const shipping = shippingFromSummary(order);
                  return (
                    <Link key={order.id} href={adminRoutes.orders} className="block border border-border p-4 space-y-2 hover:bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-sans font-semibold">#{order.id}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="font-sans text-sm break-all">{order.email}</p>
                      <p className="font-sans text-sm font-medium">{formatEuro(order.total)}</p>
                      <p className="font-sans text-xs text-muted-foreground">
                        <ShippingAddressInline shipping={shipping} />
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        {order.paidAt ? `Payée ${formatDateTime(order.paidAt)}` : formatDateTime(order.createdAt)}
                      </p>
                    </Link>
                  );
                })}
              </div>
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full font-sans text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 text-xs uppercase tracking-widest text-muted-foreground font-medium">#</th>
                    <th className="pb-3 pr-4 text-xs uppercase tracking-widest text-muted-foreground font-medium">Client</th>
                    <th className="pb-3 pr-4 text-xs uppercase tracking-widest text-muted-foreground font-medium">Livraison</th>
                    <th className="pb-3 pr-4 text-xs uppercase tracking-widest text-muted-foreground font-medium">Statut</th>
                    <th className="pb-3 pr-4 text-xs uppercase tracking-widest text-muted-foreground font-medium">Total</th>
                    <th className="pb-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Payée le</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => {
                    const shipping = shippingFromSummary(order);
                    return (
                      <tr key={order.id} className="border-b border-border last:border-0 align-top">
                        <td className="py-3 pr-4 font-medium">#{order.id}</td>
                        <td className="py-3 pr-4">{order.email}</td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground max-w-xs">
                          <ShippingAddressInline shipping={shipping} />
                        </td>
                        <td className="py-3 pr-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3 pr-4">{formatEuro(order.total)}</td>
                        <td className="py-3 text-muted-foreground whitespace-nowrap">
                          {order.paidAt ? formatDateTime(order.paidAt) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </AdminLayout>
  );
}
