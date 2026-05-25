import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCart, getGetCartQueryKey, useCreateCheckoutSession } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";

export default function Checkout() {
  const sessionId = getSessionId();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } },
  );

  const checkoutMutation = useCreateCheckoutSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;

    checkoutMutation.mutate(
      { data: { sessionId, email } },
      {
        onSuccess: (data) => {
          window.location.href = data.url;
        },
        onError: (error) => {
          const message =
            error.data && typeof error.data === "object" && "error" in error.data
              ? String((error.data as { error: string }).error)
              : error.message;
          toast({
            title: "Paiement indisponible",
            description: message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-16 max-w-3xl">
        <Link
          href="/panier"
          className="inline-flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Link>

        <h1 className="text-4xl font-sans font-bold text-foreground mb-4">Finaliser ma commande</h1>
        <p className="font-sans text-muted-foreground mb-10">
          Commande invité — aucune inscription requise. Vous serez redirigé vers Stripe pour un paiement sécurisé.
        </p>

        {isLoading ? (
          <div className="animate-pulse h-64 bg-muted w-full" />
        ) : isEmpty ? (
          <div className="text-center py-16 bg-muted/30 border border-border">
            <p className="font-sans text-muted-foreground mb-6">Votre panier est vide.</p>
            <Button asChild className="rounded-none h-12 px-8 font-sans uppercase tracking-widest text-xs">
              <Link href="/boutique">Continuer mes achats</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            <form onSubmit={handleSubmit} className="md:col-span-3 space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="font-sans text-sm uppercase tracking-widest text-foreground">
                  Email de confirmation
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="rounded-none border-border bg-transparent h-12"
                  data-testid="input-checkout-email"
                />
                <p className="text-xs font-sans text-muted-foreground">
                  Vous recevrez la confirmation de commande à cette adresse.
                </p>
              </div>

              <div className="bg-muted/30 border border-border p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-sans text-foreground">
                  <Lock className="w-4 h-4" />
                  Paiement sécurisé par Stripe
                </div>
                <p className="text-sm font-sans text-muted-foreground">
                  L&apos;adresse de livraison sera collectée sur la page de paiement Stripe. Colis discret garanti.
                </p>
              </div>

              <Button
                type="submit"
                disabled={checkoutMutation.isPending}
                className="w-full bg-foreground text-background hover:bg-primary rounded-none h-14 font-sans uppercase tracking-widest text-sm group"
                data-testid="button-pay-stripe"
              >
                {checkoutMutation.isPending ? "Redirection..." : "Payer avec Stripe"}
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            <div className="md:col-span-2">
              <div className="bg-muted/30 p-6 border border-border">
                <h2 className="font-sans font-semibold text-lg mb-4">Récapitulatif</h2>
                <ul className="space-y-3 mb-6">
                  {cart.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 font-sans text-sm">
                      <span className="text-muted-foreground">
                        {item.productName} × {item.quantity}
                      </span>
                      <span>{(item.price * item.quantity).toFixed(2)} €</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border pt-4 space-y-2 font-sans text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="text-primary">Offerte</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2">
                    <span>Total TTC</span>
                    <span>{cart.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
