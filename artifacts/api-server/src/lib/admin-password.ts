import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { db, adminAccountsTable } from "@workspace/db";

const scryptAsync = promisify(scrypt);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const [account] = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  if (account) {
    return verifyPasswordHash(password, account.passwordHash);
  }

  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envEmail || !envPassword) return false;

  if (normalizeEmail(envEmail) !== normalized) return false;
  if (password !== envPassword) return false;

  await db.insert(adminAccountsTable).values({
    email: normalized,
    passwordHash: await hashAdminPassword(password),
  });

  return true;
}

export async function changeAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const valid = await verifyAdminPassword(email, currentPassword);
  if (!valid) {
    return { ok: false, error: "Mot de passe actuel incorrect" };
  }

  if (newPassword.length < 8) {
    return { ok: false, error: "Le nouveau mot de passe doit contenir au moins 8 caractères" };
  }

  const normalized = normalizeEmail(email);
  const passwordHash = await hashAdminPassword(newPassword);
  const [existing] = await db
    .select()
    .from(adminAccountsTable)
    .where(eq(adminAccountsTable.email, normalized));

  if (existing) {
    await db
      .update(adminAccountsTable)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminAccountsTable.id, existing.id));
  } else {
    await db.insert(adminAccountsTable).values({ email: normalized, passwordHash });
  }

  return { ok: true };
}
