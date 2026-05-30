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
 * Stripe Checkout : l'adresse peut être dans collected_information.shipping_details
 * (API récente), shipping_details (legacy), customer_details ou PaymentIntent.
 */
export function extractShippingFromCheckoutSession(
  session: Stripe.Checkout.Session,
): ExtractedShipping | null {
  return (
    fromDetails(session.collected_information?.shipping_details) ??
    fromDetails(session.shipping_details) ??
    fromDetails(
      session.customer_details?.address?.line1
        ? {
            name: session.customer_details.name,
            address: session.customer_details.address,
          }
        : null,
    )
  );
}

export function extractShippingFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): ExtractedShipping | null {
  return fromDetails(paymentIntent.shipping);
}

export function extractShippingFromCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer,
): ExtractedShipping | null {
  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  const activeCustomer = customer as Stripe.Customer;

  return (
    fromDetails(
      activeCustomer.shipping?.address?.line1
        ? {
            name: activeCustomer.shipping.name,
            address: activeCustomer.shipping.address,
          }
        : null,
    ) ??
    fromDetails(
      activeCustomer.address?.line1
        ? {
            name: activeCustomer.name ?? null,
            address: activeCustomer.address,
          }
        : null,
    )
  );
}

export async function resolveShippingFromCheckoutSession(
  stripe: Stripe,
  sessionId: string,
): Promise<{ session: Stripe.Checkout.Session; shipping: ExtractedShipping | null }> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "customer"],
  });

  let shipping = extractShippingFromCheckoutSession(session);

  if (!shipping?.line1 && session.payment_intent && typeof session.payment_intent !== "string") {
    shipping = extractShippingFromPaymentIntent(session.payment_intent);
  }

  if (!shipping?.line1 && session.customer && typeof session.customer !== "string") {
    shipping = extractShippingFromCustomer(session.customer);
  }

  return { session, shipping };
}
