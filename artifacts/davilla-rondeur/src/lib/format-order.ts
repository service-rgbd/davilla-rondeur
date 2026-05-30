import type { AdminOrderSummary } from "@workspace/api-client-react";

export function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatCountry(code: string | null | undefined) {
  if (!code) return "";
  try {
    return new Intl.DisplayNames("fr", { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

type ShippingLike = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
};

export function formatShippingLines(shipping?: ShippingLike | null): string[] {
  if (!shipping?.line1) return [];
  return [
    shipping.name,
    shipping.line1,
    shipping.line2,
    [shipping.postalCode, shipping.city].filter(Boolean).join(" "),
    formatCountry(shipping.country),
    shipping.phone ? `Tél. ${shipping.phone}` : null,
  ].filter((line): line is string => Boolean(line));
}

export function formatShippingOneLine(shipping?: ShippingLike | null): string | null {
  const lines = formatShippingLines(shipping);
  if (!lines.length) return null;
  return lines.slice(0, 3).join(", ");
}

export function shippingFromSummary(order: AdminOrderSummary): ShippingLike | null {
  if (!order.shippingLine1) return null;
  return {
    name: order.shippingName,
    line1: order.shippingLine1,
    line2: order.shippingLine2,
    postalCode: order.shippingPostalCode,
    city: order.shippingCity,
    country: order.shippingCountry,
    phone: order.shippingPhone,
  };
}
