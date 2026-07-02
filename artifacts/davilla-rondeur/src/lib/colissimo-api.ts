import { customFetch } from "@workspace/api-client-react";

export type ColissimoStatus = {
  configured: boolean;
  shipFrom: {
    name: string;
    line1: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    email: string;
  };
  productCodeFrance: string;
  productCodeInternational: string;
  defaultWeightGrams: number;
};

export type ColissimoLabelResponse = {
  message: string;
  parcelNumber: string;
  trackingUrl: string;
  labelUrl: string;
};

export function fetchColissimoStatus() {
  return customFetch<ColissimoStatus>("/api/admin/colissimo/status");
}

export function generateColissimoLabel(orderId: number, weightGrams?: number) {
  return customFetch<ColissimoLabelResponse>(`/api/admin/orders/${orderId}/colissimo-label`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(weightGrams ? { weightGrams } : {}),
  });
}
