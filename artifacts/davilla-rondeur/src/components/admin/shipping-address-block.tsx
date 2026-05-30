import { formatCountry, formatShippingLines } from "@/lib/format-order";

export function ShippingAddressBlock({
  shipping,
  fallbackEmail,
}: {
  shipping?: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
  } | null;
  fallbackEmail?: string;
}) {
  const lines = formatShippingLines(shipping);

  if (!lines.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Adresse non disponible
        {fallbackEmail ? ` — ${fallbackEmail}` : ""}
      </p>
    );
  }

  return (
    <div className="space-y-0.5 text-sm">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

export function ShippingAddressInline({
  shipping,
}: {
  shipping?: {
    line1?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
}) {
  if (!shipping?.line1) {
    return <span className="text-muted-foreground">—</span>;
  }

  const cityLine = [shipping.postalCode, shipping.city].filter(Boolean).join(" ");
  const country = formatCountry(shipping.country);

  return (
    <span>
      {shipping.line1}
      {cityLine ? `, ${cityLine}` : ""}
      {country ? ` (${country})` : ""}
    </span>
  );
}
