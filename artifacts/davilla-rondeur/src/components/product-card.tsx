import { useLocation } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductImage } from "@/lib/product-images";

export function ProductCard({ product }: { product: Product }) {
  const [, setLocation] = useLocation();
  const imageUrl = getProductImage(product.slug) || product.imageUrl;

  return (
    <div
      className="group relative flex flex-col cursor-pointer"
      onClick={() => setLocation(`/produit/${product.slug}`)}
      data-testid={`card-product-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-sans text-sm">
            Davilla Rondeur
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.label && (
            <Badge
              variant="secondary"
              className="bg-white/90 text-black hover:bg-white rounded-none px-3 py-1 font-sans text-[10px] uppercase tracking-widest border-none shadow-sm backdrop-blur-sm"
            >
              {product.label}
            </Badge>
          )}
          {!product.inStock && (
            <Badge
              variant="destructive"
              className="rounded-none px-3 py-1 font-sans text-[10px] uppercase tracking-widest border-none shadow-sm"
            >
              Épuisé
            </Badge>
          )}
        </div>

        {/* Hover Action */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-20">
          <Button
            className="w-full bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground backdrop-blur-sm rounded-none border-none shadow-sm font-sans uppercase tracking-widest text-xs h-12"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/produit/${product.slug}`);
            }}
            data-testid={`button-view-product-${product.id}`}
          >
            Voir le produit
          </Button>
        </div>
      </div>

      <div className="flex flex-col flex-grow items-center text-center px-2">
        <h3 className="font-sans font-semibold text-base text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-3 font-sans text-sm mt-auto">
          {product.originalPrice && product.originalPrice > product.price ? (
            <>
              <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                {product.originalPrice.toLocaleString("fr-FR")} FCFA
              </span>
              <span className="text-primary font-semibold">
                {product.price.toLocaleString("fr-FR")} FCFA
              </span>
            </>
          ) : (
            <span className="text-foreground font-medium">
              {product.price.toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
