import type { Request, Response } from "express";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret, isStripeConfigured } from "../lib/stripe";
import { cancelPendingOrder, fulfillOrderFromStripeSession } from "../lib/orders";
import { logger } from "../lib/logger";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, getStripeWebhookSecret());
  } catch (error) {
    logger.warn({ err: error }, "Invalid Stripe webhook signature");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const thin = event.data.object as Stripe.Checkout.Session;
        const session = await stripe.checkout.sessions.retrieve(thin.id);
        await fulfillOrderFromStripeSession(session);
        break;
      }
      case "checkout.session.expired": {
        const orderId = Number.parseInt(event.data.object.metadata?.orderId ?? "", 10);
        if (Number.isFinite(orderId)) {
          await cancelPendingOrder(orderId);
        }
        break;
      }
      default:
        logger.debug({ type: event.type }, "Unhandled Stripe webhook event");
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ err: error, type: event.type }, "Stripe webhook handler failed");
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
