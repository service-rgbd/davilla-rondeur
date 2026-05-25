import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard/index";
import AdminOrders from "@/pages/admin/orders/index";
import AdminContacts from "@/pages/admin/contacts/index";
import AdminSettings from "@/pages/admin/settings/index";
import AdminProducts from "@/pages/admin/products/index";
import AdminProductEdit from "@/pages/admin/products/edit";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AdminLogin} />
      <Route path="/" component={AdminDashboard} />
      <Route path="/orders" component={AdminOrders} />
      <Route path="/contacts" component={AdminContacts} />
      <Route path="/settings" component={AdminSettings} />
      <Route path="/products" component={AdminProducts} />
      <Route path="/products/:id" component={AdminProductEdit} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function PortailApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
