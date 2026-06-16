import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { ProductReviewStars } from "@/components/product-review-stars";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  listAdminReviews,
  updateAdminReviewStatus,
  type AdminProductReview,
} from "@/lib/product-reviews-api";

const FILTERS = [
  { value: "pending", label: "En attente" },
  { value: "published", label: "Publiés" },
  { value: "rejected", label: "Refusés" },
  { value: "all", label: "Tous" },
] as const;

function ReviewRow({
  review,
  onUpdated,
}: {
  review: AdminProductReview;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const mutate = (status: "published" | "rejected") => {
    setBusy(true);
    void updateAdminReviewStatus(review.id, status)
      .then((result: { message: string }) => {
        toast({ title: result.message });
        onUpdated();
      })
      .catch(() => {
        toast({ title: "Erreur", description: "Action impossible", variant: "destructive" });
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sans font-semibold">{review.authorName}</p>
          <p className="font-sans text-xs text-muted-foreground">
            Commande #{review.orderId} · Produit #{review.productId}
          </p>
        </div>
        <ProductReviewStars rating={review.rating} />
      </div>
      <p className="font-sans text-sm whitespace-pre-line">{review.comment}</p>
      <p className="font-sans text-xs text-muted-foreground">
        {new Date(review.createdAt).toLocaleString("fr-FR")} · {review.status}
      </p>
      {review.status === "pending" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            className="rounded-none text-xs uppercase tracking-widest"
            onClick={() => mutate("published")}
          >
            Publier
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="rounded-none text-xs uppercase tracking-widest"
            onClick={() => mutate("rejected")}
          >
            Refuser
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminReviews() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("pending");
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () => listAdminReviews(filter),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">Avis clients</h1>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList className="rounded-none bg-transparent border-b border-border h-auto p-0 mb-8">
          {FILTERS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-sans uppercase tracking-widest text-xs"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FILTERS.map((item) => (
          <TabsContent key={item.value} value={item.value} className="space-y-4">
            {isLoading ? (
              <div className="h-32 animate-pulse bg-muted" />
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review: AdminProductReview) => <ReviewRow key={review.id} review={review} onUpdated={refresh} />)
            ) : (
              <p className="font-sans text-sm text-muted-foreground">Aucun avis dans cette catégorie.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
}
