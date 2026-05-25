import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY must be set");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getFrontendUrl(): string {
  const raw = process.env.FRONTEND_URL?.trim();
  if (!raw) {
    return "http://localhost:19957";
  }

  // FRONTEND_URL must be a single URL (not a comma-separated list).
  const single = raw.split(",")[0]?.trim() ?? "";
  let value = single.replace(/^['"]+|['"]+$/g, "").replace(/\/+$/, "");

  if (!value) {
    return "http://localhost:19957";
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    throw new Error(
      `FRONTEND_URL invalide: "${raw}". Mettez une seule URL, ex: https://davilla-rondeur.fr`,
    );
  }
}

export function parseOriginList(raw: string | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/^['"]+|['"]+$/g, "").replace(/\/+$/, ""))
    .filter(Boolean);
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be set");
  }
  return secret;
}

export function toAbsolutePublicUrl(baseUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const base = baseUrl.replace(/\/+$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  const [pathname, search = ""] = path.split("?");
  const encodedPath = pathname
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join("/");

  return `${base}${encodedPath}${search ? `?${search}` : ""}`;
}
