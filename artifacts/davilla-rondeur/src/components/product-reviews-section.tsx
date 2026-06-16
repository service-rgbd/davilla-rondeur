import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  InteractiveReviewStars,
  ProductReviewRatingBadge,
  ProductReviewStars,
} from "@/components/product-review-stars";
import {
  listProductReviews,
  submitProductReview,
  type ProductReviewPublic,
} from "@/lib/product-reviews-api";

export function ProductReviewsSection({
  productId,
  reviewCount,
  averageRating,
  defaultAuthorName,
}: {
  productId: number;
  reviewCount?: number | null;
  averageRating?: number | null;
  defaultAuthorName?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState(defaultAuthorName ?? "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => listProductReviews(productId),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    void submitProductReview(productId, {
      authorName: authorName.trim(),
      rating,
      comment,
    })
      .then((result: { message: string }) => {
        toast({ title: "Avis envoyé", description: result.message });
        setComment("");
        setShowForm(false);
        void queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      })
      .catch((error: unknown) => {
        const apiError = error as { data?: { error?: string }; message?: string };
        toast({
          title: "Impossible d'envoyer l'avis",
          description: apiError.data?.error ?? (error instanceof Error ? error.message : "Erreur"),
          variant: "destructive",
        });
      })
      .finally(() => setSubmitting(false));
  };

  const fieldClassName =
    "w-full border border-border bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:border-foreground";

  return (
    <section className="mt-16 border-t border-border pt-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-sans text-xl font-semibold tracking-tight">Avis clients</h2>
          {(reviewCount ?? 0) > 0 && averageRating != null ? (
            <div className="mt-2 flex items-center gap-3">
              <ProductReviewRatingBadge averageRating={averageRating} reviewCount={reviewCount} className="bg-muted px-3 py-1.5" />
            </div>
          ) : (
            <p className="font-sans text-sm text-muted-foreground mt-2">Soyez le premier à laisser un avis.</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-none font-sans uppercase tracking-widest text-xs"
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? "Masquer le formulaire" : "Laisser un avis"}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mb-10 space-y-4 bg-muted/30 border border-border p-6">
          <p className="font-sans text-sm text-muted-foreground">
            Votre avis sera visible sur le site après validation par notre équipe.
          </p>
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              Prénom ou pseudo
            </label>
            <input
              required
              minLength={2}
              maxLength={80}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className={fieldClassName}
              placeholder="Ex. Marie"
            />
          </div>
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              Note
            </label>
            <InteractiveReviewStars value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="font-sans text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              Commentaire
            </label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={fieldClassName}
              placeholder="Partagez votre expérience avec ce produit..."
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-none font-sans uppercase tracking-widest text-xs"
          >
            {submitting ? "Envoi..." : "Envoyer mon avis"}
          </Button>
        </form>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      ) : reviews && reviews.length > 0 ? (
        <ul className="space-y-6">
          {reviews.map((review: ProductReviewPublic) => (
            <li key={review.id} className="border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <p className="font-sans font-semibold">{review.authorName}</p>
                <ProductReviewStars rating={review.rating} />
              </div>
              <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-line">{review.comment}</p>
              <p className="font-sans text-xs text-muted-foreground mt-3">
                {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-sans text-sm text-muted-foreground">Aucun avis publié pour le moment.</p>
      )}
    </section>
  );
}
