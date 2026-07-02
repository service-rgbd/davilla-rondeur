import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InteractiveReviewStars } from "@/components/product-review-stars";
import { submitProductReview } from "@/lib/product-reviews-api";

export function OrderItemReviewForm({
  productId,
  productSlug,
  productName,
  defaultAuthorName,
}: {
  productId: number;
  productSlug?: string;
  productName: string;
  defaultAuthorName?: string | null;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState(defaultAuthorName?.trim() ?? "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    void submitProductReview(productId, {
      authorName: authorName.trim(),
      rating,
      comment,
      photos,
    })
      .then((result: { message: string }) => {
        setSent(true);
        setOpen(false);
        toast({ title: "Merci pour votre avis", description: result.message });
      })
      .catch((error: unknown) => {
        const apiError = error as { data?: { error?: string } };
        toast({
          title: "Erreur",
          description: apiError.data?.error ?? "Impossible d'envoyer l'avis",
          variant: "destructive",
        });
      })
      .finally(() => setSubmitting(false));
  };

  if (sent) {
    return (
      <p className="font-sans text-xs text-green-700 mt-2">
        Avis enregistré — visible après validation.
      </p>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none h-8 font-sans text-[10px] uppercase tracking-widest"
          onClick={() => setOpen(true)}
        >
          Laisser un avis
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 space-y-3 border border-border p-4 bg-background">
          <p className="font-sans text-xs text-muted-foreground">
            Avis sur {productName} — publication après validation.
          </p>
          <input
            required
            minLength={2}
            maxLength={80}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full border border-border px-3 py-2 font-sans text-sm"
            placeholder="Prénom ou pseudo"
          />
          <InteractiveReviewStars value={rating} onChange={setRating} />
          <textarea
            required
            minLength={10}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-border px-3 py-2 font-sans text-sm"
            placeholder="Votre commentaire..."
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="block w-full font-sans text-xs"
            onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, 3))}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} size="sm" className="rounded-none text-xs">
              {submitting ? "Envoi..." : "Envoyer"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="rounded-none text-xs" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}
      {productSlug ? (
        <Link href={`/produit/${productSlug}`} className="font-sans text-xs text-muted-foreground underline mt-2 inline-block">
          Voir la fiche produit
        </Link>
      ) : null}
    </div>
  );
}
