import { Router, type IRouter } from "express";
import { AdminPresignUploadBody } from "@workspace/api-zod";
import { requireAdmin } from "../../lib/auth";
import { createPresignedUpload, isR2Configured } from "../../lib/r2";

const router: IRouter = Router();

router.use(requireAdmin);

router.post("/admin/uploads/presign", async (req, res): Promise<void> => {
  const parsed = AdminPresignUploadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!isR2Configured()) {
    res.status(503).json({ error: "Stockage R2 non configuré" });
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(parsed.data.contentType)) {
    res.status(400).json({ error: "Type de fichier non autorisé (jpeg, png, webp, gif)" });
    return;
  }

  const result = await createPresignedUpload(parsed.data);
  res.json(result);
});

export default router;
