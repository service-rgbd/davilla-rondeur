import { Router, type IRouter } from "express";
import multer from "multer";
import { AdminPresignUploadBody } from "@workspace/api-zod";
import { requireAdmin } from "../../lib/auth";
import { createPresignedUpload, isR2Configured, uploadObjectToR2 } from "../../lib/r2";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

router.use(requireAdmin);

router.post("/admin/uploads", upload.single("file"), async (req, res): Promise<void> => {
  if (!isR2Configured()) {
    res.status(503).json({ error: "Stockage R2 non configuré" });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Fichier requis (champ « file »)" });
    return;
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    res.status(400).json({ error: "Type de fichier non autorisé (jpeg, png, webp, gif)" });
    return;
  }

  try {
    const result = await uploadObjectToR2({
      buffer: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Échec de l'upload",
    });
  }
});

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

  if (!ALLOWED_TYPES.includes(parsed.data.contentType)) {
    res.status(400).json({ error: "Type de fichier non autorisé (jpeg, png, webp, gif)" });
    return;
  }

  const result = await createPresignedUpload(parsed.data);
  res.json(result);
});

export default router;
