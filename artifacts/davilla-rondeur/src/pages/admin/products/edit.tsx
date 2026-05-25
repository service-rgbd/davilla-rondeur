import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  useAdminGetProduct,
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useListCategories,
  getAdminListProductsQueryKey,
  getAdminGetProductQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadProductImage } from "@/lib/upload";
import { ArrowLeft, Upload, X } from "lucide-react";
import type { AdminCreateProductInput, AdminUpdateProductInput } from "@workspace/api-client-react";

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinLines(values: string[] | undefined): string {
  return values?.join("\n") ?? "";
}

export default function AdminProductEdit() {
  const [, params] = useRoute("/admin/products/:id");
  const idParam = params?.id;
  const isNew = idParam === "new";
  const productId = isNew ? undefined : Number.parseInt(idParam ?? "", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  const { data: existing, isLoading } = useAdminGetProduct(productId as number, {
    query: {
      enabled: !isNew && Number.isFinite(productId),
      queryKey: getAdminGetProductQueryKey(productId as number),
    },
  });

  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [label, setLabel] = useState("");
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [sizesText, setSizesText] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setSlug(existing.slug ?? "");
      setDescription(existing.description ?? "");
      setPrice(String(existing.price));
      setOriginalPrice(existing.originalPrice != null ? String(existing.originalPrice) : "");
      setCategoryId(String(existing.categoryId));
      setLabel(existing.label ?? "");
      setInStock(existing.inStock ?? true);
      setFeatured(existing.featured ?? false);
      setSizesText(joinLines(existing.sizes));
      setColorsText(joinLines(existing.colors));
      setImageUrl(existing.imageUrl ?? "");
      setGallery(existing.images ?? []);
    }
  }, [existing]);

  const handleUpload = async (file: File, target: "primary" | "gallery") => {
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      if (target === "primary") {
        setImageUrl(url);
        if (!gallery.includes(url)) setGallery((prev) => [url, ...prev.filter((u) => u !== url)]);
      } else {
        setGallery((prev) => (prev.includes(url) ? prev : [...prev, url]));
        if (!imageUrl) setImageUrl(url);
      }
      toast({ title: "Image uploadée", description: "Fichier enregistré sur Cloudflare R2." });
    } catch (error) {
      toast({
        title: "Upload échoué",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const buildCreatePayload = (): AdminCreateProductInput => ({
    name,
    slug: slug.trim() || null,
    description: description || null,
    price: Number.parseFloat(price),
    originalPrice: originalPrice ? Number.parseFloat(originalPrice) : null,
    categoryId: Number.parseInt(categoryId, 10),
    label: label || null,
    inStock,
    featured,
    sizes: parseLines(sizesText),
    colors: parseLines(colorsText),
    imageUrl: imageUrl || null,
    images: gallery,
  });

  const buildUpdatePayload = (): AdminUpdateProductInput => ({
    name,
    slug: slug.trim() || undefined,
    description: description || null,
    price: Number.parseFloat(price),
    originalPrice: originalPrice ? Number.parseFloat(originalPrice) : null,
    categoryId: Number.parseInt(categoryId, 10),
    label: label || null,
    inStock,
    featured,
    sizes: parseLines(sizesText),
    colors: parseLines(colorsText),
    imageUrl: imageUrl || null,
    images: gallery,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNew) {
      createMutation.mutate(
        { data: buildCreatePayload() },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
            toast({ title: "Produit créé" });
            setLocation("/admin/products");
          },
          onError: (err) => showError(err),
        },
      );
    } else if (productId) {
      updateMutation.mutate(
        { id: productId, data: buildUpdatePayload() },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
            toast({ title: "Produit mis à jour" });
          },
          onError: (err) => showError(err),
        },
      );
    }
  };

  const showError = (err: { data?: unknown; message?: string }) => {
    const message =
      err.data && typeof err.data === "object" && "error" in err.data
        ? String((err.data as { error: string }).error)
        : err.message ?? "Erreur";
    toast({ title: "Erreur", description: message, variant: "destructive" });
  };

  if (!isNew && isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse h-96 bg-muted" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      <h1 className="text-3xl font-sans font-bold mb-8">{isNew ? "Nouveau produit" : "Modifier le produit"}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="rounded-none h-11" />
          </div>
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Slug (optionnel)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-none h-11" placeholder="auto-généré si vide" />
          </div>
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-none min-h-[140px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">Prix (€)</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="rounded-none h-11" />
            </div>
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">Prix barré (€)</Label>
              <Input type="number" step="0.01" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="rounded-none h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="rounded-none h-11">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Étiquette (Best-seller, etc.)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-none h-11" />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Switch checked={inStock} onCheckedChange={setInStock} id="in-stock" />
              <Label htmlFor="in-stock">En stock</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
              <Label htmlFor="featured">Vedette</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Formats (un par ligne)</Label>
            <Textarea value={sizesText} onChange={(e) => setSizesText(e.target.value)} className="rounded-none min-h-[80px]" placeholder="250 ml" />
          </div>
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-xs">Couleurs (une par ligne)</Label>
            <Textarea value={colorsText} onChange={(e) => setColorsText(e.target.value)} className="rounded-none min-h-[80px]" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border p-6 space-y-4">
            <h2 className="font-sans font-semibold">Photo principale</h2>
            {imageUrl ? (
              <div className="relative aspect-square max-w-xs bg-muted overflow-hidden">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-square max-w-xs bg-muted flex items-center justify-center text-sm text-muted-foreground">
                Aucune image
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                id="primary-upload"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file, "primary");
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" className="rounded-none" disabled={uploading} asChild>
                <label htmlFor="primary-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Upload..." : "Uploader (R2)"}
                </label>
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">URL image principale</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-none h-11 text-xs" />
            </div>
          </div>

          <div className="border border-border p-6 space-y-4">
            <h2 className="font-sans font-semibold">Galerie</h2>
            <div className="grid grid-cols-3 gap-3">
              {gallery.map((url) => (
                <div key={url} className="relative aspect-square bg-muted overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-background/90 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setGallery((prev) => prev.filter((u) => u !== url))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                id="gallery-upload"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file, "gallery");
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" className="rounded-none" disabled={uploading} asChild>
                <label htmlFor="gallery-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter à la galerie
                </label>
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || uploading}
            className="w-full rounded-none h-12 font-sans uppercase tracking-widest text-xs"
          >
            {isNew ? "Créer le produit" : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
