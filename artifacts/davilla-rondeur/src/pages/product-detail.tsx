import { Layout } from "@/components/layout/layout";
import { useRoute } from "wouter";
import { useListProducts, useGetProduct, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getProductGallery } from "@/lib/product-images";

export default function ProductDetail() {
  const [, params] = useRoute("/produit/:slug");
  const slug = params?.slug;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: allProducts, isLoading: isListLoading } = useListProducts();
  const matchedProduct = allProducts?.find((p) => p.slug === slug);
  const productId = matchedProduct?.id;

  const { data: product, isLoading: isProductLoading } = useGetProduct(
    productId as number,
    { query: { enabled: !!productId, queryKey: ["product", productId] } }
  );

  const addToCartMutation = useAddToCart();
  const sessionId = getSessionId();

  useEffect(() => {
    if (product) {
      if (product.sizes?.length) setSelectedSize(product.sizes[0]);
      if (product.colors?.length) setSelectedColor(product.colors[0]);
      setActiveImageIndex(0);
    }
  }, [product]);

  const isLoading = isListLoading || isProductLoading || (!product && !!productId);

  const handleAddToCart = () => {
    if (!product) return;
    addToCartMutation.mutate(
      { data: { sessionId, productId: product.id, quantity: 1, size: selectedSize, color: selectedColor } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          toast({ title: "Produit ajouté", description: `${product.name} a été ajouté à votre panier.` });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le produit au panier." });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/2 aspect-square bg-muted"></div>
            <div className="w-full md:w-1/2 space-y-6">
              <div className="h-10 w-2/3 bg-muted"></div>
              <div className="h-6 w-1/3 bg-muted"></div>
              <div className="h-24 w-full bg-muted mt-8"></div>
              <div className="h-12 w-full bg-muted mt-8"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-sans font-semibold text-foreground mb-4">Produit introuvable</h1>
          <p className="font-sans text-muted-foreground">Le produit que vous recherchez n'est plus disponible ou n'existe pas.</p>
        </div>
      </Layout>
    );
  }

  const gallery = getProductGallery(product.slug);
  const images = gallery.length > 0 ? gallery : [product.imageUrl].filter(Boolean) as string[];

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">

          {/* Left: Images */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
            {images.length > 1 && (
              <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 flex-shrink-0 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative aspect-square w-20 md:w-full flex-shrink-0 overflow-hidden",
                      activeImageIndex === idx ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`${product.name} vue ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-grow aspect-square relative overflow-hidden bg-muted">
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover animate-in fade-in"
                  key={activeImageIndex}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-sans text-muted-foreground">Davilla Rondeur</div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {product.label && (
              <div className="mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 rounded-none px-3 py-1 font-sans text-[10px] uppercase tracking-widest border-none">
                  {product.label}
                </Badge>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-4">{product.name}</h1>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-2xl font-sans font-semibold text-foreground">
                {product.price.toLocaleString("fr-FR")} FCFA
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg font-sans text-muted-foreground line-through mb-1">
                  {product.originalPrice.toLocaleString("fr-FR")} FCFA
                </span>
              )}
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-sans text-sm uppercase tracking-widest text-foreground">Couleur</span>
                  <span className="font-sans text-sm text-muted-foreground">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2 border font-sans text-sm transition-colors",
                        selectedColor === color ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/50"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-sans text-sm uppercase tracking-widest text-foreground">Format</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-4 h-12 flex items-center justify-center border font-sans text-sm transition-colors",
                        selectedSize === size ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-foreground"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mb-12 space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock || addToCartMutation.isPending}
                className="w-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground rounded-none h-14 font-sans uppercase tracking-widest text-sm"
                data-testid="button-add-to-cart"
              >
                {addToCartMutation.isPending ? "Ajout..." : product.inStock ? "Ajouter au panier" : "Épuisé"}
              </Button>
              <p className="text-center font-sans text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                Expédition sous 24h — Colis discret
              </p>
            </div>

            {/* Accordion Info */}
            <Accordion type="single" collapsible className="w-full border-t border-border">
              <AccordionItem value="description" className="border-border">
                <AccordionTrigger className="font-sans uppercase tracking-widest text-sm hover:no-underline py-6">Description</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground leading-relaxed font-light pb-6">
                  {product.description || "Un produit naturel, formulé avec soin pour accompagner votre bien-être au quotidien."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="composition" className="border-border">
                <AccordionTrigger className="font-sans uppercase tracking-widest text-sm hover:no-underline py-6">Composition & Utilisation</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground leading-relaxed font-light pb-6">
                  Ingrédients 100% naturels, sans additifs chimiques ni conservateurs artificiels. Prendre selon les indications inscrites sur l'emballage. Tenir hors de portée des enfants. Consulter un professionnel de santé en cas de doute.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="livraison" className="border-border">
                <AccordionTrigger className="font-sans uppercase tracking-widest text-sm hover:no-underline py-6">Livraison & Retours</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground leading-relaxed font-light pb-6">
                  Livraison discrète dans un emballage neutre sans mention de la marque. Expédition sous 24h après confirmation de commande. Retours acceptés sous 14 jours pour les produits non ouverts.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </Layout>
  );
}
