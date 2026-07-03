import { Layout } from "@/components/layout/layout";
import { useGetCart, useRemoveFromCart, getGetCartQueryKey, useListProducts } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { MaintenanceNotice } from "@/components/maintenance-notice";
import { useMaintenanceStatus } from "@/hooks/use-maintenance";
import { Trash2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { resolveProductImage } from "@/lib/product-images";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function Cart() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const search = useSearch();
  const { toast } = useToast();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const { data: allProducts } = useListProducts();
  const { data: maintenance } = useMaintenanceStatus();

  const removeMutation = useRemoveFromCart();

  const handleRemove = (itemId: number) => {
    removeMutation.mutate(
      { itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        },
      }
    );
  };

  const getCartItemImage = (productId: number): string => {
    const product = allProducts?.find((p) => p.id === productId);
    if (product) return resolveProductImage(product) || product.imageUrl || "";
    return "";
  };

  const getCartItemSlug = (productId: number): string => {
    return allProducts?.find((p) => p.id === productId)?.slug ?? String(productId);
  };

  const isEmpty = !cart || cart.items.length === 0;

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("checkout") === "cancelled") {
      toast({
        title: "Paiement annulé",
        description: "Votre panier est toujours disponible. Reprenez quand vous le souhaitez.",
      });
    }
  }, [search, toast]);

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-16 max-w-6xl">
        <h1 className="text-4xl font-sans font-bold text-foreground mb-12">Votre Panier</h1>

        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-muted w-full"></div>
            <div className="h-24 bg-muted w-full"></div>
            <div className="h-40 bg-muted w-full md:w-1/3 ml-auto"></div>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-20 bg-muted/30 border border-border">
            <h2 className="text-2xl font-sans font-semibold text-foreground mb-4">Votre panier est vide</h2>
            <p className="font-sans text-muted-foreground mb-8">Découvrez nos produits naturels et laissez-vous tenter.</p>
            <Button asChild className="bg-foreground text-background hover:bg-primary rounded-none h-12 px-8 font-sans uppercase tracking-widest text-xs">
              <Link href="/boutique" data-testid="button-return-shop">Continuer mes achats</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            {/* Items List */}
            <div className="flex-grow">
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-border text-xs font-sans uppercase tracking-widest text-muted-foreground">
                <div className="col-span-6">Produit</div>
                <div className="col-span-2 text-center">Quantité</div>
                <div className="col-span-3 text-right">Prix</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-border">
                {cart.items.map((item) => {
                  const imageUrl = getCartItemImage(item.productId);
                  const slug = getCartItemSlug(item.productId);
                  return (
                    <div
                      key={item.id}
                      className="py-6 flex flex-col md:grid md:grid-cols-12 md:items-center gap-6"
                      data-testid={`cart-item-${item.id}`}
                    >
                      {/* Product Info */}
                      <div className="col-span-6 flex gap-5 items-center">
                        <div className="w-20 h-20 bg-muted flex-shrink-0 relative overflow-hidden rounded-sm">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-sans">
                              Davilla
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <Link
                            href={`/produit/${slug}`}
                            className="font-sans font-semibold text-base text-foreground hover:text-primary transition-colors"
                          >
                            {item.productName}
                          </Link>
                          {(item.size || item.color) && (
                            <div className="font-sans text-sm text-muted-foreground mt-1 space-y-0.5">
                              {item.color && <p>Couleur : {item.color}</p>}
                              {item.size && <p>Format : {item.size}</p>}
                            </div>
                          )}
                          {/* Mobile price */}
                          <div className="md:hidden mt-3 flex items-center justify-between font-sans">
                            <span className="text-muted-foreground text-sm">Qté : {item.quantity}</span>
                            <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity (Desktop) */}
                      <div className="hidden md:block col-span-2 text-center font-sans">
                        {item.quantity}
                      </div>

                      {/* Price (Desktop) */}
                      <div className="hidden md:block col-span-3 text-right font-sans font-semibold text-lg">
                        {(item.price * item.quantity).toFixed(2)} €
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 flex justify-end md:justify-center">
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removeMutation.isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                          aria-label="Supprimer"
                          data-testid={`button-remove-item-${item.id}`}
                        >
                          <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-muted/30 p-8 border border-border">
                <h2 className="text-xl font-sans font-semibold text-foreground mb-6">Récapitulatif</h2>

                <div className="space-y-4 font-sans text-sm mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{cart.total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="text-primary">Offerte</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="font-sans uppercase tracking-widest text-sm text-foreground">Total TTC</span>
                  <span className="font-sans font-bold text-3xl text-foreground">{cart.total.toFixed(2)} €</span>
                </div>

                {maintenance?.paymentsBlocked ? (
                  <MaintenanceNotice
                    message={maintenance.message}
                    supportEmail={maintenance.supportEmail}
                    backHref="/boutique"
                    backLabel="Continuer mes achats"
                    compact
                  />
                ) : (
                  <Button
                    asChild
                    className="w-full bg-foreground text-background hover:bg-primary rounded-none h-14 font-sans uppercase tracking-widest text-sm group"
                    data-testid="button-checkout"
                  >
                    <Link href="/checkout">
                      Procéder au paiement
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                )}

                <div className="mt-6 flex justify-center gap-4 opacity-50">
                  <span className="text-xs font-sans">Paiement sécurisé</span>
                  <span className="text-xs font-sans">•</span>
                  <span className="text-xs font-sans">Colis discret</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
