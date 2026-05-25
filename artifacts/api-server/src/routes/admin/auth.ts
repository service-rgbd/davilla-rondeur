import { Router, type IRouter } from "express";
import {
  isAdminAuthConfigured,
  requireAdmin,
  signAdminToken,
  updateAdminPassword,
  verifyAdminCredentials,
} from "../../lib/auth";
import {
  createTwoFactorSetup,
  disableAdminTwoFactor,
  enableAdminTwoFactor,
  getAdminTwoFactorStatus,
  isAdminTwoFactorEnabled,
  verifyAdminTwoFactorCode,
  signTwoFactorChallenge,
  verifyTwoFactorChallenge,
} from "../../lib/admin-2fa";
import { consumeRateLimit, getClientIp } from "../../lib/rate-limit";
import {
  AdminChangePasswordBody,
  AdminDisableTwoFactorBody,
  AdminEnableTwoFactorBody,
  AdminLoginBody,
  AdminVerifyTwoFactorBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const LOGIN_MAX = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const TWO_FACTOR_MAX = 8;
const TWO_FACTOR_WINDOW_MS = 15 * 60 * 1000;

function sendRateLimited(res: ExpressResponse, retryAfterSec: number): void {
  res.setHeader("Retry-After", String(retryAfterSec));
  res.status(429).json({
    error: `Trop de tentatives. Réessayez dans ${retryAfterSec} secondes.`,
  });
}

type ExpressResponse = import("express").Response;

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

  const ip = getClientIp(req);
  const rate = consumeRateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS);
  if (!rate.allowed) {
    sendRateLimited(res, rate.retryAfterSec);
    return;
  }

  const { email, password } = parsed.data;
  if (!(await verifyAdminCredentials(email, password))) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }

  if (await isAdminTwoFactorEnabled(email)) {
    const challengeToken = await signTwoFactorChallenge(email);
    res.json({
      email,
      requiresTwoFactor: true,
      challengeToken,
    });
    return;
  }

  const token = await signAdminToken(email);
  res.json({ token, email, requiresTwoFactor: false });
});

router.post("/admin/auth/verify-2fa", async (req, res): Promise<void> => {
  const parsed = AdminVerifyTwoFactorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const ip = getClientIp(req);
  const rate = consumeRateLimit(`2fa:${ip}`, TWO_FACTOR_MAX, TWO_FACTOR_WINDOW_MS);
  if (!rate.allowed) {
    sendRateLimited(res, rate.retryAfterSec);
    return;
  }

  let email: string;
  try {
    email = await verifyTwoFactorChallenge(parsed.data.challengeToken);
  } catch {
    res.status(401).json({ error: "Session 2FA expirée. Reconnectez-vous." });
    return;
  }

  if (!(await verifyAdminTwoFactorCode(email, parsed.data.code))) {
    res.status(401).json({ error: "Code de vérification invalide" });
    return;
  }

  const token = await signAdminToken(email);
  res.json({ token, email, requiresTwoFactor: false });
});

router.get("/admin/auth/2fa/status", requireAdmin, async (req, res): Promise<void> => {
  const email = req.admin?.email;
  if (!email) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const status = await getAdminTwoFactorStatus(email);
  res.json(status);
});

router.post("/admin/auth/2fa/setup", requireAdmin, async (req, res): Promise<void> => {
  const email = req.admin?.email;
  if (!email) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const setup = await createTwoFactorSetup(email);
  if ("error" in setup) {
    res.status(400).json({ error: setup.error });
    return;
  }

  res.json(setup);
});

router.post("/admin/auth/2fa/enable", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminEnableTwoFactorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = req.admin?.email;
  if (!email) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const result = await enableAdminTwoFactor(email, parsed.data.code);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: "Double authentification activée" });
});

router.post("/admin/auth/2fa/disable", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminDisableTwoFactorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = req.admin?.email;
  if (!email) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const result = await disableAdminTwoFactor(email, parsed.data.code);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: "Double authentification désactivée" });
});

router.post("/admin/auth/change-password", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminEmail = req.admin?.email;
  if (!adminEmail) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "La confirmation ne correspond pas au nouveau mot de passe" });
    return;
  }

  const result = await updateAdminPassword(adminEmail, currentPassword, newPassword);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: "Mot de passe mis à jour" });
});

export default router;
