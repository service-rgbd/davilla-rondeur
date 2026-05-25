import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import Boutique from "@/pages/boutique";
import ProductDetail from "@/pages/product-detail";
import Univers from "@/pages/univers";
import FAQ from "@/pages/faq";
import Contact from "@/pages/contact";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderSuccess from "@/pages/order-success";
import AdminLogin from "@/pages/admin/login";
import AdminProducts from "@/pages/admin/products/index";
import AdminProductEdit from "@/pages/admin/products/edit";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/boutique" component={Boutique} />
      <Route path="/produit/:slug" component={ProductDetail} />
      <Route path="/univers" component={Univers} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/panier" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/commande/succes" component={OrderSuccess} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/:id" component={AdminProductEdit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

export default App;
