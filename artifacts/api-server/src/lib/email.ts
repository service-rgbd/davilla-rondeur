import { Resend } from "resend";
import { logger } from "./logger";

type OrderEmailPayload = {
  orderId: number;
  email: string;
  total: number;
  items: Array<{ productName: string; quantity: number; price: number }>;
  shippingAddress?: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
};

let resendClient: Resend | null = null;

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set");
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "Davilla Rondeur <onboarding@resend.dev>";
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Retourne true si l'email a bien été envoyé (false si Resend absent ou erreur). */
export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<boolean> {
  const itemsHtml = payload.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${item.productName} × ${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${(item.price * item.quantity).toFixed(2)} €</td></tr>`,
    )
    .join("");

  const shipping = payload.shippingAddress;
  const shippingHtml =
    shipping?.line1 ?
      `<div style="margin:24px 0;padding:16px;background:#f7f7f7;border-radius:4px">
        <p style="margin:0 0 8px;font-weight:600">Adresse de livraison</p>
        ${shipping.name ? `<p style="margin:0">${shipping.name}</p>` : ""}
        <p style="margin:0">${shipping.line1}</p>
        ${shipping.line2 ? `<p style="margin:0">${shipping.line2}</p>` : ""}
        <p style="margin:0">${[shipping.postalCode, shipping.city].filter(Boolean).join(" ")}</p>
        ${shipping.country ? `<p style="margin:0">${shipping.country}</p>` : ""}
      </div>`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h1 style="font-size:24px;font-weight:600">Merci pour votre commande</h1>
      <p>Bonjour,</p>
      <p>Votre commande <strong>#${payload.orderId}</strong> chez Davilla Rondeur est confirmée.</p>
      <table style="width:100%;margin:24px 0;border-collapse:collapse">
        ${itemsHtml}
        <tr><td style="padding:12px 0;font-weight:600">Total TTC</td><td style="padding:12px 0;font-weight:600;text-align:right">${payload.total.toFixed(2)} €</td></tr>
      </table>
      ${shippingHtml}
      <p>Nous préparons votre colis discret avec soin.</p>
      <p style="color:#666;font-size:14px">L'équipe Davilla Rondeur</p>
    </div>
  `.trim();

  if (!isResendConfigured()) {
    logger.warn(
      { orderId: payload.orderId, email: payload.email },
      "Email de confirmation non envoyé — RESEND_API_KEY manquant sur le serveur",
    );
    return false;
  }

  const { data, error } = await getResend().emails.send({
    from: getFromAddress(),
    to: payload.email,
    subject: `Confirmation de commande #${payload.orderId} — Davilla Rondeur`,
    html,
    text: [
      `Merci pour votre commande #${payload.orderId} chez Davilla Rondeur.`,
      "",
      ...payload.items.map(
        (item) => `- ${item.productName} × ${item.quantity} : ${(item.price * item.quantity).toFixed(2)} €`,
      ),
      "",
      `Total TTC : ${payload.total.toFixed(2)} €`,
      "",
      shipping?.line1
        ? [
            "Adresse de livraison :",
            shipping.name ?? "",
            shipping.line1,
            shipping.line2 ?? "",
            `${shipping.postalCode ?? ""} ${shipping.city ?? ""}`.trim(),
            shipping.country ?? "",
          ]
            .filter(Boolean)
            .join("\n")
        : "",
      "",
      "Nous préparons votre colis discret avec soin.",
      "L'équipe Davilla Rondeur",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (error) {
    logger.error(
      {
        err: error,
        orderId: payload.orderId,
        email: payload.email,
        from: getFromAddress(),
        resendMessage: error.message,
      },
      "Échec envoi email de confirmation via Resend — vérifiez le domaine davilla-rondeur.fr dans Resend",
    );
    return false;
  }

  if (!data?.id) {
    logger.error(
      { orderId: payload.orderId, email: payload.email },
      "Resend n'a pas renvoyé d'identifiant d'email",
    );
    return false;
  }

  logger.info(
    { orderId: payload.orderId, email: payload.email, resendId: data.id },
    "Order confirmation sent via Resend",
  );
  return true;
}
