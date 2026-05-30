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

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readAddress(value: unknown): Stripe.Address | null {
  const record = readRecord(value);
  if (!record || typeof record.line1 !== "string") return null;
  return record as Stripe.Address;
}

/** Fallback JSON brut — utile si le SDK Stripe ne mappe pas collected_information. */
function extractShippingFromRawSession(session: unknown): ExtractedShipping | null {
  const root = readRecord(session);
  if (!root) return null;

  const collected = readRecord(root.collected_information);
  const collectedShipping = readRecord(collected?.shipping_details);
  const collectedAddress = readAddress(collectedShipping?.address);
  if (collectedAddress) {
    const name =
      (typeof collectedShipping?.name === "string" ? collectedShipping.name : null) ??
      (typeof collected?.individual_name === "string" ? collected.individual_name : null);
    return fromDetails({ name, address: collectedAddress });
  }

  const legacyShipping = readRecord(root.shipping_details);
  const legacy = fromDetails({
    name: typeof legacyShipping?.name === "string" ? legacyShipping.name : null,
    address: readAddress(legacyShipping?.address),
  });
  if (legacy) return legacy;

  const customerDetails = readRecord(root.customer_details);
  const customerAddress = readAddress(customerDetails?.address);
  if (customerAddress) {
    return fromDetails({
      name: typeof customerDetails?.name === "string" ? customerDetails.name : null,
      address: customerAddress,
    });
  }

  return null;
}

/**
 * Stripe Checkout : l'adresse peut être dans collected_information.shipping_details
 * (API récente), shipping_details (legacy), customer_details ou PaymentIntent.
 */
export function extractShippingFromCheckoutSession(
  session: Stripe.Checkout.Session,
): ExtractedShipping | null {
  const collectedName =
    session.collected_information?.shipping_details?.name ??
    (session.collected_information as { individual_name?: string | null } | null | undefined)
      ?.individual_name ??
    null;

  return (
    fromDetails({
      name: collectedName,
      address: session.collected_information?.shipping_details?.address,
    }) ??
    fromDetails(session.shipping_details) ??
    fromDetails(
      session.customer_details?.address?.line1
        ? {
            name: session.customer_details.name,
            address: session.customer_details.address,
          }
        : null,
    ) ??
    extractShippingFromRawSession(session)
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

export function isStripeLiveSession(sessionId: string): boolean {
  return sessionId.startsWith("cs_live_");
}

export function isStripeTestSecretKey(secretKey: string | undefined): boolean {
  return Boolean(secretKey?.startsWith("sk_test_"));
}

export function isStripeLiveSecretKey(secretKey: string | undefined): boolean {
  return Boolean(secretKey?.startsWith("sk_live_"));
}

export function describeStripeKeyMismatch(sessionId: string): string | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (isStripeLiveSession(sessionId) && isStripeTestSecretKey(secretKey)) {
    return "Session Stripe live mais STRIPE_SECRET_KEY est en mode test (sk_test_)";
  }
  if (sessionId.startsWith("cs_test_") && isStripeLiveSecretKey(secretKey)) {
    return "Session Stripe test mais STRIPE_SECRET_KEY est en mode live (sk_live_)";
  }
  return null;
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

  if (!shipping?.line1 && typeof session.payment_intent === "string") {
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    shipping = extractShippingFromPaymentIntent(paymentIntent);
  }

  if (!shipping?.line1 && session.customer && typeof session.customer !== "string") {
    shipping = extractShippingFromCustomer(session.customer);
  }

  if (!shipping?.line1 && session.customer && typeof session.customer === "string") {
    const customer = await stripe.customers.retrieve(session.customer);
    if (!("deleted" in customer && customer.deleted)) {
      shipping = extractShippingFromCustomer(customer);
    }
  }

  return { session, shipping };
}

export function getPaymentIntentIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }
  return session.payment_intent?.id ?? null;
}
