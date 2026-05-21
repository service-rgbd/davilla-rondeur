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

export default function ProductDetail() {
  const [, params] = useRoute("/produit/:slug");
  const slug = params?.slug;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 1. Find product ID from slug
  const { data: allProducts, isLoading: isListLoading } = useListProducts();
  const matchedProduct = allProducts?.find(p => p.slug === slug);
  const productId = matchedProduct?.id;

  // 2. Fetch full product details
  const { data: product, isLoading: isProductLoading } = useGetProduct(
    productId as number, 
    { query: { enabled: !!productId, queryKey: ['product', productId] } }
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
    
    addToCartMutation.mutate({
      data: {
        sessionId,
        productId: product.id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        toast({
          title: "Produit ajouté",
          description: `${product.name} a été ajouté à votre panier.`,
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'ajouter le produit au panier.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/2 aspect-[3/4] bg-muted"></div>
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
          <h1 className="text-3xl font-serif text-foreground mb-4">Produit introuvable</h1>
          <p className="font-sans text-muted-foreground">La pièce que vous recherchez n'est plus disponible ou n'existe pas.</p>
        </div>
      </Layout>
    );
  }

  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left: Images */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
            {/* Thumbnails (vertical on desktop, horizontal on mobile) */}
            {images.length > 1 && (
              <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 flex-shrink-0 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative aspect-[3/4] w-20 md:w-full flex-shrink-0 overflow-hidden",
                      activeImageIndex === idx ? "border-2 border-primary" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`${product.name} vue ${idx+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image */}
            <div className="flex-grow aspect-[3/4] relative overflow-hidden bg-muted">
              {images[activeImageIndex] ? (
                <img 
                  src={images[activeImageIndex]} 
                  alt={product.name}
                  className="w-full h-full object-cover animate-in fade-in"
                  key={activeImageIndex}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-serif text-muted-foreground">Davilla</div>
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
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-4">{product.name}</h1>
            
            <div className="flex items-end gap-4 mb-8">
              <span className="text-2xl font-sans text-foreground">
                {product.price.toFixed(2)} €
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg font-sans text-muted-foreground line-through mb-1">
                  {product.originalPrice.toFixed(2)} €
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
                  {product.colors.map(color => (
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
                  <span className="font-sans text-sm uppercase tracking-widest text-foreground">Taille</span>
                  <button className="font-sans text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground">Guide des tailles</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-12 h-12 flex items-center justify-center border font-sans text-sm transition-colors",
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
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Expédition sous 24h
              </p>
            </div>

            {/* Accordion Info */}
            <Accordion type="single" collapsible className="w-full border-t border-border">
              <AccordionItem value="description" className="border-border">
                <AccordionTrigger className="font-sans uppercase tracking-widest text-sm hover:no-underline py-6">Description</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground leading-relaxed font-light pb-6">
                  {product.description || "Une pièce d'exception conçue pour épouser et sublimer vos courbes. La qualité des finitions et le choix des matières offrent un confort absolu tout au long de la journée."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="composition" className="border-border">
                <AccordionTrigger className="font-sans uppercase tracking-widest text-sm hover:no-underline py-6">Composition & Entretien</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground leading-relaxed font-light pb-6">
                  Matières nobles sélectionnées avec soin. Lavage à la main recommandé ou en machine à 30°C dans un filet de protection. Ne pas utiliser d'agents blanchissants. Séchage à plat.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="livraison" className="border-border">
                <AccordionTrigger className="font-sans uppercase tracking-widest text-sm hover:no-underline py-6">Livraison & Retours</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground leading-relaxed font-light pb-6">
                  Livraison standard offerte dès 80€ d'achat. Expédition discrète dans un emballage neutre. Retours acceptés sous 14 jours (articles non portés, étiquettes non détachées).
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </div>
        </div>
      </div>
    </Layout>
  );
}
