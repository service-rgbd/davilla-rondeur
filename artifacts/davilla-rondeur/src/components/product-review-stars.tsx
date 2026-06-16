import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductReviewStars({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rating;
        return (
          <Star
            key={index}
            className={cn(iconClass, filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          />
        );
      })}
    </div>
  );
}

export function ProductReviewRatingBadge({
  averageRating,
  reviewCount,
  className,
}: {
  averageRating: number | null | undefined;
  reviewCount?: number | null;
  className?: string;
}) {
  if (!reviewCount || reviewCount <= 0 || averageRating == null) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-sans text-xs text-foreground/90 bg-white/90 backdrop-blur-sm px-2 py-1 shadow-sm",
        className,
      )}
    >
      <ProductReviewStars rating={Math.round(averageRating)} />
      <span className="font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount})</span>
    </div>
  );
}

export function InteractiveReviewStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            aria-label={`Noter ${starValue} sur 5`}
            onClick={() => onChange(starValue)}
            className="p-0.5"
          >
            <Star className={cn("h-5 w-5", active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        );
      })}
    </div>
  );
}
