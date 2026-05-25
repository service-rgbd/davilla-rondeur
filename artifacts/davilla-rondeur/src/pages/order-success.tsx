import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { useGetOrderByStripeSession, getGetOrderByStripeSessionQueryKey } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { resolveProductImage } from "@/lib/product-images";
import { useListProducts } from "@workspace/api-client-react";

function useStripeSessionId(): string | null {
  const search = useSearch();
  const params = new URLSearchParams(search);
  return params.get("session_id");
}

export default function OrderSuccess() {
  const stripeSessionId = useStripeSessionId();
  const { data: products } = useListProducts();

  const { data: order, isLoading, isError, refetch } = useGetOrderByStripeSession(
    stripeSessionId ?? "",
    {
      query: {
        enabled: !!stripeSessionId,
        queryKey: getGetOrderByStripeSessionQueryKey(stripeSessionId ?? ""),
        refetchInterval: (query) => {
          const status = query.state.data?.status;
          if (status === "paid") return false;
          return 2000;
        },
        retry: 5,
      },
    },
  );

  const getItemImage = (productId: number): string => {
    const product = products?.find((p) => p.id === productId);
    if (product) return resolveProductImage(product) || product.imageUrl || "";
    return "";
  };

  if (!stripeSessionId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-xl">
          <h1 className="text-3xl font-sans font-bold mb-4">Session invalide</h1>
          <p className="font-sans text-muted-foreground mb-8">
            Le lien de confirmation est incomplet. Consultez votre email ou contactez-nous.
          </p>
          <Button asChild className="rounded-none">
            <Link href="/boutique">Retour à la boutique</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isPending = order?.status === "pending";
  const isPaid = order?.status === "paid";

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-16 max-w-3xl">
        {isLoading || isPending ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-6" />
            <h1 className="text-2xl font-sans font-semibold mb-2">Confirmation en cours...</h1>
            <p className="font-sans text-muted-foreground">
              Nous validons votre paiement. Cela ne prend que quelques secondes.
            </p>
          </div>
        ) : isError || !order ? (
          <div className="text-center py-20">
            <h1 className="text-2xl font-sans font-semibold mb-4">Commande introuvable</h1>
            <p className="font-sans text-muted-foreground mb-8">
              Si vous avez été débité, contactez-nous avec votre email de confirmation.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-none mr-4">
              Réessayer
            </Button>
            <Button asChild className="rounded-none">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        ) : isPaid ? (
          <>
            <div className="text-center mb-12">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl font-sans font-bold text-foreground mb-4">Merci pour votre commande !</h1>
              <p className="font-sans text-muted-foreground">
                Commande <strong>#{order.id}</strong> confirmée. Un email a été envoyé à{" "}
                <strong>{order.email}</strong>.
              </p>
            </div>

            <div className="bg-muted/30 border border-border p-8 mb-8">
              <h2 className="font-sans font-semibold text-lg mb-6">Détails de la commande</h2>
              <ul className="divide-y divide-border">
                {order.items.map((item) => {
                  const imageUrl = getItemImage(item.productId);
                  return (
                    <li key={item.id} className="py-4 flex gap-4 items-center">
                      <div className="w-16 h-16 bg-muted flex-shrink-0 overflow-hidden rounded-sm">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-grow font-sans">
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">Quantité : {item.quantity}</p>
                      </div>
                      <p className="font-sans font-semibold">{(item.price * item.quantity).toFixed(2)} €</p>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 pt-6 border-t border-border space-y-2 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{order.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{order.shippingAmount === 0 ? "Offerte" : `${order.shippingAmount.toFixed(2)} €`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total TTC</span>
                  <span>{order.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {order.shippingAddress?.line1 && (
              <div className="bg-muted/30 border border-border p-8 mb-8 font-sans text-sm">
                <h3 className="font-semibold uppercase tracking-widest text-xs mb-4">Adresse de livraison</h3>
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="rounded-none h-12 px-8 font-sans uppercase tracking-widest text-xs">
                <Link href="/boutique">Continuer mes achats</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h1 className="text-2xl font-sans font-semibold mb-4">Statut : {order.status}</h1>
            <p className="font-sans text-muted-foreground mb-8">
              Votre commande est en cours de traitement.
            </p>
            <Button asChild className="rounded-none">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
