import type Stripe from "stripe";

export type ExtractedShipping = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
};

type ShippingDetailsLike = {
  name?: string | null;
  address?: Stripe.Address | null;
};

function fromDetails(details: ShippingDetailsLike | null | undefined): ExtractedShipping | null {
  const line1 = details?.address?.line1;
  if (!line1) return null;

  return {
    name: details?.name ?? null,
    line1,
    line2: details?.address?.line2 ?? null,
    city: details?.address?.city ?? null,
    postalCode: details?.address?.postal_code ?? null,
    country: details?.address?.country ?? null,
  };
}

/**
 * Stripe Checkout : l'adresse peut être dans shipping_details, collected_information
 * ou customer_details selon la version d'API / le payload webhook.
 */
export function extractShippingFromCheckoutSession(
  session: Stripe.Checkout.Session,
): ExtractedShipping | null {
  const collected = (
    session as Stripe.Checkout.Session & {
      collected_information?: { shipping_details?: ShippingDetailsLike };
    }
  ).collected_information?.shipping_details;

  return (
    fromDetails(session.shipping_details) ??
    fromDetails(collected) ??
    fromDetails(
      session.customer_details
        ? {
            name: session.customer_details.name,
            address: session.customer_details.address,
          }
        : null,
    )
  );
}
