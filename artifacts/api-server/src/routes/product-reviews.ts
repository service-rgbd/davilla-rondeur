import { Router, type IRouter } from "express";
import { z } from "zod";
import { notifyAdminsNewReview } from "../lib/admin-push";
import { logger } from "../lib/logger";
import {
  listPublishedReviewsForProduct,
  submitProductReview,
} from "../lib/product-reviews";

const router: IRouter = Router();

const SubmitReviewBody = z.object({
  authorName: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const productId = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(productId)) {
    res.status(400).json({ error: "ID produit invalide" });
    return;
  }

  const reviews = await listPublishedReviewsForProduct(productId);
  res.json(reviews);
});

router.post("/products/:id/reviews", async (req, res): Promise<void> => {
  const productId = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(productId)) {
    res.status(400).json({ error: "ID produit invalide" });
    return;
  }

  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const { review, productName } = await submitProductReview({
      productId,
      ...parsed.data,
    });

    void notifyAdminsNewReview({
      reviewId: review.id,
      orderId: review.orderId,
      productName,
      authorName: review.authorName,
      rating: review.rating,
      comment: review.comment,
    }).catch((error) => {
      logger.warn({ err: error, reviewId: review.id }, "Notification push nouvel avis échouée");
    });

    res.status(201).json({
      id: review.id,
      message: "Merci ! Votre avis sera visible après validation par notre équipe.",
      status: review.status,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({ error: "Impossible d'enregistrer l'avis" });
      return;
    }

    switch (error.message) {
      case "PRODUCT_NOT_FOUND":
        res.status(404).json({ error: "Produit introuvable" });
        return;
      case "INVALID_RATING":
        res.status(400).json({ error: "La note doit être entre 1 et 5" });
        return;
      case "COMMENT_TOO_SHORT":
        res.status(400).json({ error: "Le commentaire doit contenir au moins 10 caractères" });
        return;
      case "AUTHOR_NAME_TOO_SHORT":
        res.status(400).json({ error: "Indiquez un prénom ou pseudo (2 caractères minimum)" });
        return;
      default:
        res.status(400).json({ error: error.message });
    }
  }
});

export default router;
