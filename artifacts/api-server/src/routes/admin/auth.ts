import { Router, type IRouter } from "express";
import { isAdminAuthConfigured, signAdminToken, verifyAdminCredentials } from "../../lib/auth";
import { AdminLoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!isAdminAuthConfigured()) {
    res.status(503).json({ error: "Authentification admin non configurée" });
    return;
  }

  const { email, password } = parsed.data;
  if (!verifyAdminCredentials(email, password)) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }

  const token = await signAdminToken(email);
  res.json({ token, email });
});

export default router;
