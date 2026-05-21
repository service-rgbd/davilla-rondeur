import { Layout } from "@/components/layout/layout";
import { useListCategories, useListProducts } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearch } from "wouter";

export default function Boutique() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialCategory = searchParams.get("category") || "tout";

  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: products, isLoading: isLoadingProducts } = useListProducts();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "tout") return products;
    
    // Find category id from slug
    const category = categories?.find(c => c.slug === activeCategory);
    if (category) {
      return products.filter(p => p.categoryId === category.id);
    }
    return products;
  }, [products, categories, activeCategory]);

  return (
    <Layout>
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-sans font-bold text-foreground mb-4">La Boutique</h1>
          <p className="font-sans text-muted-foreground max-w-2xl mx-auto">
            Découvrez nos formules naturelles conçues pour sublimer vos courbes, booster votre vitalité et prendre soin de vous de l'intérieur.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-16">
        {/* Category Filters */}
        <div className="flex justify-center mb-16 overflow-x-auto pb-4 no-scrollbar">
          {isLoadingCategories ? (
            <div className="h-10 w-96 bg-muted animate-pulse"></div>
          ) : (
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full max-w-3xl flex justify-center">
              <TabsList className="bg-transparent h-auto p-0 flex space-x-6 border-b border-border rounded-none">
                <TabsTrigger 
                  value="tout" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-sans uppercase tracking-widest text-xs data-[state=active]:text-primary"
                  data-testid="tab-category-all"
                >
                  Tout
                </TabsTrigger>
                {categories?.map((cat) => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.slug}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-sans uppercase tracking-widest text-xs data-[state=active]:text-primary whitespace-nowrap"
                    data-testid={`tab-category-${cat.slug}`}
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Product Grid */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse flex flex-col gap-4">
                <div className="bg-muted aspect-[3/4] w-full"></div>
                <div className="bg-muted h-6 w-3/4 mx-auto"></div>
                <div className="bg-muted h-4 w-1/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${(i % 4) * 150}ms`, animationFillMode: 'both' }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground font-sans">
            Aucun produit ne correspond à cette catégorie pour le moment.
          </div>
        )}
      </div>
    </Layout>
  );
}
