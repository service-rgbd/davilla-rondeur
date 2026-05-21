import { Link, useLocation } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const [, setLocation] = useLocation();

  return (
    <div className="group relative flex flex-col cursor-pointer" onClick={() => setLocation(`/produit/${product.slug}`)} data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-4">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif">
            Davilla
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.label && (
            <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white rounded-none px-3 py-1 font-sans text-[10px] uppercase tracking-widest border-none shadow-sm backdrop-blur-sm">
              {product.label}
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="destructive" className="rounded-none px-3 py-1 font-sans text-[10px] uppercase tracking-widest border-none shadow-sm">
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
        <h3 className="font-serif text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-3 font-sans text-sm mt-auto">
          {product.originalPrice && product.originalPrice > product.price ? (
            <>
              <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                {product.originalPrice.toFixed(2)} €
              </span>
              <span className="text-primary font-medium">
                {product.price.toFixed(2)} €
              </span>
            </>
          ) : (
            <span className="text-foreground">
              {product.price.toFixed(2)} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
