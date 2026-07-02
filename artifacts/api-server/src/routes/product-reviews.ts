import { Router, type IRouter } from "express";
import multer from "multer";
import { z } from "zod";
import { notifyAdminsNewReview } from "../lib/admin-push";
import { logger } from "../lib/logger";
import { isR2Configured, uploadObjectToR2 } from "../lib/r2";
import {
  listPublishedReviewsForProduct,
  submitProductReview,
} from "../lib/product-reviews";

const router: IRouter = Router();

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_REVIEW_PHOTOS = 3;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: MAX_REVIEW_PHOTOS },
});

const SubmitReviewFields = z.object({
  authorName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
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

router.post(
  "/products/:id/reviews",
  upload.array("photos", MAX_REVIEW_PHOTOS),
  async (req, res): Promise<void> => {
    const productId = Number.parseInt(String(req.params.id), 10);
    if (!Number.isFinite(productId)) {
      res.status(400).json({ error: "ID produit invalide" });
      return;
    }

    const parsed = SubmitReviewFields.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length > MAX_REVIEW_PHOTOS) {
      res.status(400).json({ error: `Maximum ${MAX_REVIEW_PHOTOS} photos par avis` });
      return;
    }

    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
        res.status(400).json({ error: "Photo non autorisée (jpeg, png, webp, gif)" });
        return;
      }
    }

    try {
      const photoUrls: string[] = [];
      if (files.length > 0) {
        if (!isR2Configured()) {
          res.status(503).json({ error: "Upload de photos temporairement indisponible" });
          return;
        }
        for (const file of files) {
          const uploaded = await uploadObjectToR2({
            buffer: file.buffer,
            filename: file.originalname,
            contentType: file.mimetype,
            prefix: "reviews",
          });
          photoUrls.push(uploaded.publicUrl);
        }
      }

      const { review, productName } = await submitProductReview({
        productId,
        ...parsed.data,
        photoUrls,
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
  },
);

export default router;
