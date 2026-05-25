import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { CreateCheckoutSessionBody } from "@workspace/api-zod";
import { getFrontendUrl, getStripe, isStripeConfigured, toAbsolutePublicUrl } from "../lib/stripe";
import {
  cancelPendingOrder,
  createPendingOrderFromCart,
  getOrderByStripeSessionId,
  OrderError,
} from "../lib/orders";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/checkout/sessions", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Le paiement n'est pas encore configuré. Contactez le support." });
    return;
  }

  const { sessionId, email } = parsed.data;

  try {
    const { order, cartItems, total } = await createPendingOrderFromCart(sessionId, email);
    const stripe = getStripe();
    const frontendUrl = getFrontendUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: cartItems.map((item) => {
        const imageUrl = item.productImageUrl
          ? toAbsolutePublicUrl(frontendUrl, item.productImageUrl)
          : undefined;
        return {
          quantity: item.quantity,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(parseFloat(item.price) * 100),
            product_data: {
              name: item.productName,
              ...(imageUrl ? { images: [imageUrl] } : {}),
              metadata: {
                productId: String(item.productId),
                ...(item.size ? { size: item.size } : {}),
                ...(item.color ? { color: item.color } : {}),
              },
            },
          },
        };
      }),
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "MC", "DE", "IT", "ES", "GB"],
      },
      success_url: `${frontendUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/panier?checkout=cancelled`,
      metadata: {
        orderId: String(order.id),
        sessionId,
      },
    });

    if (!session.url) {
      await cancelPendingOrder(order.id);
      res.status(500).json({ error: "Impossible de créer la session de paiement" });
      return;
    }

    await db
      .update(ordersTable)
      .set({ stripeSessionId: session.id })
      .where(eq(ordersTable.id, order.id));

    logger.info({ orderId: order.id, stripeSessionId: session.id, total }, "Checkout session created");

    res.json({ url: session.url, orderId: order.id });
  } catch (error) {
    if (error instanceof OrderError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    if (error instanceof Error && error.message.includes("FRONTEND_URL")) {
      res.status(503).json({ error: error.message });
      return;
    }

    logger.error({ err: error }, "Failed to create checkout session");
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

export default router;
