import { authenticator } from "otplib";
import QRCode from "qrcode";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, adminAccountsTable } from "@workspace/db";

const CHALLENGE_TTL = "5m";
const APP_NAME = "Davilla Rondeur Admin";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET must be set");
  }
  return new TextEncoder().encode(secret);
}

export async function getAdminTwoFactorStatus(email: string): Promise<{
  enabled: boolean;
  configured: boolean;
}> {
  const normalized = normalizeEmail(email);
  const [account] = await db
    .select({
      totpEnabled: adminAccountsTable.totpEnabled,
      totpSecret: adminAccountsTable.totpSecret,
    })
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  return {
    enabled: account?.totpEnabled ?? false,
    configured: Boolean(account?.totpSecret),
  };
}

export async function isAdminTwoFactorEnabled(email: string): Promise<boolean> {
  const status = await getAdminTwoFactorStatus(email);
  return status.enabled;
}

export async function createTwoFactorSetup(email: string): Promise<
  | { secret: string; otpauthUrl: string; qrCodeDataUrl: string }
  | { error: string }
> {
  const normalized = normalizeEmail(email);
  const [account] = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  if (!account) {
    return { error: "Compte admin introuvable. Connectez-vous une première fois." };
  }

  const secret = authenticator.generateSecret();

  await db
    .update(adminAccountsTable)
    .set({
      totpSecret: secret,
      totpEnabled: false,
      updatedAt: new Date(),
    })
    .where(eq(adminAccountsTable.id, account.id));

  const otpauthUrl = authenticator.keyuri(normalized, APP_NAME, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, otpauthUrl, qrCodeDataUrl };
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

export async function enableAdminTwoFactor(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  const [account] = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  if (!account?.totpSecret) {
    return { ok: false, error: "Configurez d'abord la double authentification" };
  }

  if (!verifyTotpCode(account.totpSecret, code)) {
    return { ok: false, error: "Code de vérification invalide" };
  }

  await db
    .update(adminAccountsTable)
    .set({ totpEnabled: true, updatedAt: new Date() })
    .where(eq(adminAccountsTable.id, account.id));

  return { ok: true };
}

export async function disableAdminTwoFactor(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  const [account] = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  if (!account?.totpEnabled || !account.totpSecret) {
    return { ok: false, error: "La double authentification n'est pas active" };
  }

  if (!verifyTotpCode(account.totpSecret, code)) {
    return { ok: false, error: "Code de vérification invalide" };
  }

  await db
    .update(adminAccountsTable)
    .set({ totpSecret: null, totpEnabled: false, updatedAt: new Date() })
    .where(eq(adminAccountsTable.id, account.id));

  return { ok: true };
}

export async function verifyAdminTwoFactorCode(
  email: string,
  code: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const [account] = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  if (!account?.totpEnabled || !account.totpSecret) return false;
  return verifyTotpCode(account.totpSecret, code);
}

export async function signTwoFactorChallenge(email: string): Promise<string> {
  return new SignJWT({ email: normalizeEmail(email), purpose: "admin-2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CHALLENGE_TTL)
    .sign(getJwtSecret());
}

export async function verifyTwoFactorChallenge(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (payload.purpose !== "admin-2fa" || typeof payload.email !== "string") {
    throw new Error("Invalid challenge");
  }
  return payload.email;
}
