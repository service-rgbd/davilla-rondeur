import {
  useAdminListProducts,
  useAdminDeleteProduct,
  getAdminListProductsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { resolveProductImage } from "@/lib/product-images";
import { adminRoutes } from "@/lib/admin-routes";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useAdminListProducts();
  const deleteMutation = useAdminDeleteProduct();

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
        },
      },
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold">Produits</h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">Gérez le catalogue et les photos (R2)</p>
        </div>
        <Button asChild className="rounded-none font-sans uppercase tracking-widest text-xs h-11 w-full sm:w-auto">
          <Link href={adminRoutes.productNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-40 bg-muted" />
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {products?.map((product) => {
              const imageUrl = resolveProductImage(product);
              return (
                <div key={product.id} className="border border-border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-muted overflow-hidden shrink-0">
                      {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-semibold">{product.name}</p>
                      <p className="font-sans text-xs text-muted-foreground truncate">{product.slug}</p>
                      <p className="font-sans text-sm mt-1">{product.price.toFixed(2)} €</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 font-sans text-xs text-muted-foreground">
                    <span>{product.inStock ? "En stock" : "Épuisé"}</span>
                    {product.featured ? <span>· Vedette</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-none flex-1">
                      <Link href={adminRoutes.productEdit(product.id)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block border border-border overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium uppercase tracking-widest text-xs">Produit</th>
                <th className="text-left p-4 font-medium uppercase tracking-widest text-xs">Prix</th>
                <th className="text-left p-4 font-medium uppercase tracking-widest text-xs">Stock</th>
                <th className="text-left p-4 font-medium uppercase tracking-widest text-xs">Vedette</th>
                <th className="text-right p-4 font-medium uppercase tracking-widest text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => {
                const imageUrl = resolveProductImage(product);
                return (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted overflow-hidden flex-shrink-0">
                          {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : null}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{product.price.toFixed(2)} €</td>
                    <td className="p-4">{product.inStock ? "En stock" : "Épuisé"}</td>
                    <td className="p-4">{product.featured ? "Oui" : "Non"}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-none">
                          <Link href={adminRoutes.productEdit(product.id)}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </AdminLayout>
  );
}
