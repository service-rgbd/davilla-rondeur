import { Router, type IRouter } from "express";
import type { Readable } from "node:stream";
import { getR2Object, isR2Configured } from "../lib/r2";

const router: IRouter = Router();

router.get("/media/{*key}", async (req, res): Promise<void> => {
  if (!isR2Configured()) {
    res.status(503).json({ error: "Stockage R2 non configuré" });
    return;
  }

  const keyParam = req.params.key;
  const key = Array.isArray(keyParam) ? keyParam.join("/") : keyParam;
  if (!key) {
    res.status(400).json({ error: "Clé média manquante" });
    return;
  }

  try {
    const { body, contentType } = await getR2Object(key);
    if (!body || typeof (body as Readable).pipe !== "function") {
      res.status(404).json({ error: "Fichier introuvable" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    (body as Readable).pipe(res);
  } catch {
    res.status(404).json({ error: "Fichier introuvable" });
  }
});

export default router;
