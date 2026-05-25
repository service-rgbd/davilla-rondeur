import { Router, type IRouter } from "express";
import { GetOrderByStripeSessionParams } from "@workspace/api-zod";
import { getOrderByStripeSessionId } from "../lib/orders";

const router: IRouter = Router();

router.get("/orders/by-stripe-session/:stripeSessionId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.stripeSessionId)
    ? req.params.stripeSessionId[0]
    : req.params.stripeSessionId;
  const parsed = GetOrderByStripeSessionParams.safeParse({ stripeSessionId: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const order = await getOrderByStripeSessionId(parsed.data.stripeSessionId);
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.json(order);
});

export default router;
