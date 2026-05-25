import { Router, type IRouter, type Response } from "express";
import type { Readable } from "node:stream";
import { getR2Object, isR2Configured } from "../lib/r2";

const router: IRouter = Router();

async function serveR2Key(key: string, res: Response): Promise<void> {
  if (!isR2Configured()) {
    res.status(503).json({ error: "Stockage R2 non configuré" });
    return;
  }

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
}

router.get("/media/products/:filename", async (req, res) => {
  const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  await serveR2Key(`products/${filename}`, res);
});

router.get("/media/*key", async (req, res) => {
  const keyParam = req.params.key;
  const key = Array.isArray(keyParam) ? keyParam.join("/") : keyParam;
  await serveR2Key(key, res);
});

export default router;
