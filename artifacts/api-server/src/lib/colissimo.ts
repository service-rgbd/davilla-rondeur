import type { Order } from "@workspace/db";
import { logger } from "./logger";
import { isR2Configured, uploadObjectToR2 } from "./r2";

export type ColissimoConfig = {
  contractNumber: string;
  password: string;
  apiUrl: string;
  productCodeFrance: string;
  productCodeInternational: string;
  defaultWeightGrams: number;
  commercialName: string;
};

export type ShipFromAddress = {
  name: string;
  line1: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
};

export type ColissimoLabelResult = {
  parcelNumber: string;
  labelUrl: string;
  trackingUrl: string;
};

export function isColissimoConfigured(): boolean {
  return Boolean(process.env.COLISSIMO_CONTRACT_NUMBER?.trim() && process.env.COLISSIMO_PASSWORD?.trim());
}

export function getColissimoConfig(): ColissimoConfig | null {
  const contractNumber = process.env.COLISSIMO_CONTRACT_NUMBER?.trim();
  const password = process.env.COLISSIMO_PASSWORD?.trim();
  if (!contractNumber || !password) return null;

  return {
    contractNumber,
    password,
    apiUrl:
      process.env.COLISSIMO_API_URL?.trim() ??
      "https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel",
    productCodeFrance: process.env.COLISSIMO_PRODUCT_CODE_FR?.trim() || "DOM",
    productCodeInternational: process.env.COLISSIMO_PRODUCT_CODE_INTL?.trim() || "COLI",
    defaultWeightGrams: Number.parseInt(process.env.COLISSIMO_DEFAULT_WEIGHT_GRAMS ?? "500", 10) || 500,
    commercialName: process.env.COLISSIMO_COMMERCIAL_NAME?.trim() || "Davilla Rondeur",
  };
}

export function getShipFromAddress(): ShipFromAddress {
  return {
    name: process.env.SHIP_FROM_NAME?.trim() || "Davilla Rondeur",
    line1: process.env.SHIP_FROM_LINE1?.trim() || "27 place des fleurs",
    postalCode: process.env.SHIP_FROM_POSTAL_CODE?.trim() || "78955",
    city: process.env.SHIP_FROM_CITY?.trim() || "Carrières-sous-Poissy",
    country: process.env.SHIP_FROM_COUNTRY?.trim() || "FR",
    phone: process.env.SHIP_FROM_PHONE?.trim() || "+33603686294",
    email: process.env.SHIP_FROM_EMAIL?.trim() || "support@davilla-rondeur.fr",
  };
}

export function buildColissimoTrackingUrl(parcelNumber: string): string {
  return `https://www.laposte.fr/outils/suivre-vo-colis?code=${encodeURIComponent(parcelNumber)}`;
}

function splitPersonName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const trimmed = fullName?.trim();
  if (!trimmed) return { firstName: "Client", lastName: "Davilla" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "." };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function formatColissimoPhone(phone: string | null | undefined): string | undefined {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return undefined;
  if (digits.startsWith("33")) return digits;
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
}

function resolveProductCode(country: string | null | undefined, config: ColissimoConfig): string {
  const normalized = (country ?? "FR").trim().toUpperCase();
  return normalized === "FR" ? config.productCodeFrance : config.productCodeInternational;
}

function buildGenerateLabelPayload(order: Order, weightGrams: number, config: ColissimoConfig) {
  const sender = getShipFromAddress();
  const addressee = splitPersonName(order.shippingName);
  const country = (order.shippingCountry ?? "FR").trim().toUpperCase();
  const depositDate = new Date().toISOString().slice(0, 10);

  return {
    contractNumber: config.contractNumber,
    password: config.password,
    outputFormat: {
      x: "0",
      y: "0",
      outputPrintingType: "PDF_10x15_300dpi",
    },
    letter: {
      service: {
        productCode: resolveProductCode(country, config),
        depositDate,
        orderNumber: String(order.id),
        commercialName: config.commercialName,
      },
      parcel: {
        weight: Number((weightGrams / 1000).toFixed(3)),
      },
      sender: {
        senderParcelRef: `order-${order.id}`,
        address: {
          companyName: sender.name,
          line2: sender.line1,
          countryCode: sender.country,
          city: sender.city,
          zipCode: sender.postalCode,
          phoneNumber: formatColissimoPhone(sender.phone),
          email: sender.email,
        },
      },
      addressee: {
        addresseeParcelRef: `order-${order.id}`,
        address: {
          lastName: addressee.lastName,
          firstName: addressee.firstName,
          line2: order.shippingLine1 ?? "Adresse manquante",
          line3: order.shippingLine2 ?? undefined,
          countryCode: country,
          city: order.shippingCity ?? "Ville",
          zipCode: order.shippingPostalCode ?? "00000",
          phoneNumber: formatColissimoPhone(order.shippingPhone ?? undefined),
          email: order.email,
        },
      },
    },
  };
}

type ColissimoJsonResponse = {
  messages?: Array<{ type?: string; messageContent?: string }>;
  labelV2Response?: {
    parcelNumber?: string;
    pdfUrl?: string;
  };
};

function parseColissimoMtomResponse(body: Buffer, contentType: string | null): {
  json: ColissimoJsonResponse;
  labelPdf: Buffer | null;
} {
  const ct = contentType ?? "";
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^\s;]+))/i.exec(ct);
  if (!boundaryMatch) {
    throw new Error("COLISSIMO_INVALID_RESPONSE");
  }

  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  const raw = body.toString("latin1");
  const parts = raw.split(`--${boundary}`);

  let json: ColissimoJsonResponse = {};
  let labelPdf: Buffer | null = null;

  for (const part of parts) {
    if (part.includes("jsonInfos") || part.includes("application/json")) {
      const jsonStart = part.indexOf("{");
      const jsonEnd = part.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        json = JSON.parse(part.slice(jsonStart, jsonEnd + 1)) as ColissimoJsonResponse;
      }
    }

    if (part.includes("application/pdf") || part.includes("application/octet-stream")) {
      const headerEnd = part.indexOf("\r\n\r\n");
      if (headerEnd >= 0) {
        const binaryPart = part.slice(headerEnd + 4).replace(/\r\n--?\s*$/, "");
        if (binaryPart.length > 0) {
          labelPdf = Buffer.from(binaryPart, "latin1");
        }
      }
    }
  }

  return { json, labelPdf };
}

function extractColissimoErrors(json: ColissimoJsonResponse): string[] {
  const messages = json.messages ?? [];
  return messages
    .filter((item) => item.type === "ERROR" || item.type === "FATAL")
    .map((item) => item.messageContent?.trim())
    .filter((message): message is string => Boolean(message));
}

function getCheckGenerateLabelUrl(apiUrl: string): string {
  return apiUrl.replace(/generateLabel\/?$/, "checkGenerateLabel");
}

async function callColissimoApi(
  apiUrl: string,
  order: Order,
  weightGrams: number,
  config: ColissimoConfig,
): Promise<{ json: ColissimoJsonResponse; labelPdf: Buffer | null }> {
  const payload = buildGenerateLabelPayload(order, weightGrams, config);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    const bodyPreview = body.toString("utf8").slice(0, 500);
    logger.warn({ status: response.status, orderId: order.id, bodyPreview }, "Colissimo HTTP error");

    try {
      const errorJson = JSON.parse(bodyPreview) as ColissimoJsonResponse;
      const errors = extractColissimoErrors(errorJson);
      if (errors.length) {
        throw new Error(errors.join(" · "));
      }
    } catch (parseError) {
      if (parseError instanceof Error && !parseError.message.startsWith("Unexpected token")) {
        throw parseError;
      }
    }

    const springError = bodyPreview.match(/"error"\s*:\s*"([^"]+)"/)?.[1];
    throw new Error(springError ?? `COLISSIMO_HTTP_ERROR (${response.status})`);
  }

  return parseColissimoMtomResponse(body, response.headers.get("content-type"));
}

export async function checkColissimoLabel(
  order: Order,
  weightGrams?: number,
): Promise<{ ok: boolean; messages: string[] }> {
  const config = getColissimoConfig();
  if (!config) {
    throw new Error("COLISSIMO_NOT_CONFIGURED");
  }

  if (!order.shippingLine1 || !order.shippingPostalCode || !order.shippingCity || !order.shippingCountry) {
    throw new Error("COLISSIMO_MISSING_ADDRESS");
  }

  const effectiveWeight = weightGrams ?? order.packageWeightGrams ?? config.defaultWeightGrams;
  const { json } = await callColissimoApi(getCheckGenerateLabelUrl(config.apiUrl), order, effectiveWeight, config);
  const errors = extractColissimoErrors(json);
  const infos = (json.messages ?? [])
    .filter((item) => item.type === "INFOS" || item.type === "WARNING")
    .map((item) => item.messageContent?.trim())
    .filter((message): message is string => Boolean(message));

  return {
    ok: errors.length === 0,
    messages: errors.length ? errors : infos,
  };
}

export async function generateColissimoLabel(
  order: Order,
  weightGrams?: number,
): Promise<ColissimoLabelResult> {
  const config = getColissimoConfig();
  if (!config) {
    throw new Error("COLISSIMO_NOT_CONFIGURED");
  }

  if (!order.shippingLine1 || !order.shippingPostalCode || !order.shippingCity || !order.shippingCountry) {
    throw new Error("COLISSIMO_MISSING_ADDRESS");
  }

  const effectiveWeight = weightGrams ?? order.packageWeightGrams ?? config.defaultWeightGrams;
  const { json, labelPdf } = await callColissimoApi(config.apiUrl, order, effectiveWeight, config);
  const errors = extractColissimoErrors(json);
  if (errors.length) {
    throw new Error(errors.join(" · "));
  }

  const parcelNumber = json.labelV2Response?.parcelNumber?.trim();
  if (!parcelNumber) {
    throw new Error("COLISSIMO_NO_PARCEL_NUMBER");
  }

  let labelUrl = json.labelV2Response?.pdfUrl?.trim() ?? "";
  if (labelPdf && labelPdf.length > 0 && isR2Configured()) {
    const uploaded = await uploadObjectToR2({
      buffer: labelPdf,
      filename: `colissimo-${order.id}-${parcelNumber}.pdf`,
      contentType: "application/pdf",
      prefix: "labels",
    });
    labelUrl = uploaded.publicUrl;
  }

  return {
    parcelNumber,
    labelUrl,
    trackingUrl: buildColissimoTrackingUrl(parcelNumber),
  };
}
