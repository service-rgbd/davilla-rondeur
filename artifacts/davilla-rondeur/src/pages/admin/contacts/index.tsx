import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminListCustomers,
  useAdminListNewsletterSubscribers,
} from "@workspace/api-client-react";
import { Mail, MapPin, ShoppingBag } from "lucide-react";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function CustomersTab() {
  const { data: customers, isLoading } = useAdminListCustomers();

  if (isLoading) {
    return <div className="h-48 animate-pulse bg-muted border border-border" />;
  }

  if (!customers?.length) {
    return (
      <div className="border border-border p-12 text-center font-sans text-sm text-muted-foreground">
        Aucun contact enregistré
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {customers.map((customer) => (
        <Card key={customer.email} className="rounded-none border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base font-semibold flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="break-all">{customer.email}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-sans text-sm">
            {customer.name ? <p className="font-medium">{customer.name}</p> : null}
            {customer.city || customer.country ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                {[customer.city, customer.country].filter(Boolean).join(", ")}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              {customer.sources.map((source) => (
                <span
                  key={source}
                  className="px-2 py-1 text-[10px] uppercase tracking-widest border border-border bg-muted/30"
                >
                  {source === "order" ? "Commande" : "Newsletter"}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Commandes</p>
                <p className="font-semibold flex items-center gap-1 mt-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {customer.orderCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Total dépensé</p>
                <p className="font-semibold mt-1">{formatEuro(customer.totalSpent)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dernière activité : {formatDate(customer.lastOrderAt)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NewsletterTab() {
  const { data: subscribers, isLoading } = useAdminListNewsletterSubscribers();

  if (isLoading) {
    return <div className="h-48 animate-pulse bg-muted border border-border" />;
  }

  if (!subscribers?.length) {
    return (
      <div className="border border-border p-12 text-center font-sans text-sm text-muted-foreground">
        Aucun abonné newsletter
      </div>
    );
  }

  return (
    <div className="border border-border overflow-x-auto md:overflow-visible">
      <table className="w-full font-sans text-sm min-w-[320px]">
        <thead className="bg-muted/40 border-b border-border">
          <tr>
            <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Email</th>
            <th className="text-left p-4 text-xs uppercase tracking-widest font-medium">Inscription</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((sub) => (
            <tr key={sub.id} className="border-b border-border last:border-0">
              <td className="p-4">{sub.email}</td>
              <td className="p-4 text-muted-foreground">{formatDate(sub.subscribedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminContacts() {
  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">Contacts</h1>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Clients ayant commandé et abonnés à la newsletter
        </p>
      </div>

      <Tabs defaultValue="customers">
        <TabsList className="rounded-none h-auto flex w-full overflow-x-auto flex-nowrap bg-muted/40 p-1 mb-6 scrollbar-thin">
          <TabsTrigger
            value="customers"
            className="rounded-none shrink-0 font-sans text-xs uppercase tracking-widest data-[state=active]:bg-background"
          >
            Clients
          </TabsTrigger>
          <TabsTrigger
            value="newsletter"
            className="rounded-none shrink-0 font-sans text-xs uppercase tracking-widest data-[state=active]:bg-background"
          >
            Newsletter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomersTab />
        </TabsContent>
        <TabsContent value="newsletter">
          <NewsletterTab />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
