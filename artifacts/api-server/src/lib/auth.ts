import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response, NextFunction } from "express";

const TOKEN_TTL = "7d";

export type AdminPayload = {
  email: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET must be set");
  }
  return new TextEncoder().encode(secret);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_JWT_SECRET);
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  return safeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) && safeEqual(password, adminPassword);
}

export async function signAdminToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  if (typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return { email: payload.email };
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  try {
    req.admin = await verifyAdminToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Session expirée ou invalide" });
  }
}
