import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAdmin } from "../../lib/auth";
import {
  listAdminReviews,
  listReviewsForOrder,
  publishPendingReviewsForOrder,
  updateReviewStatus,
} from "../../lib/product-reviews";

const router: IRouter = Router();

const UpdateReviewBody = z.object({
  status: z.enum(["published", "rejected"]),
});

router.get("/admin/reviews", requireAdmin, async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  const allowed = new Set(["pending", "published", "rejected", "all"]);
  const filter = allowed.has(status) ? status : "pending";

  const reviews = await listAdminReviews(filter);
  res.json(reviews);
});

router.get("/admin/orders/:id/reviews", requireAdmin, async (req, res): Promise<void> => {
  const orderId = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  res.json(await listReviewsForOrder(orderId));
});

router.patch("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const reviewId = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(reviewId)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const parsed = UpdateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await updateReviewStatus(reviewId, parsed.data.status);
    res.json({
      message: parsed.data.status === "published" ? "Avis publié sur la boutique" : "Avis refusé",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REVIEW_NOT_FOUND") {
      res.status(404).json({ error: "Avis introuvable" });
      return;
    }
    res.status(500).json({ error: "Impossible de mettre à jour l'avis" });
  }
});

router.post("/admin/orders/:id/publish-reviews", requireAdmin, async (req, res): Promise<void> => {
  const orderId = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const publishedCount = await publishPendingReviewsForOrder(orderId);
  res.json({
    message:
      publishedCount > 0
        ? `${publishedCount} avis publié${publishedCount > 1 ? "s" : ""} sur la boutique.`
        : "Aucun avis en attente pour cette commande.",
    publishedCount,
  });
});

export default router;
