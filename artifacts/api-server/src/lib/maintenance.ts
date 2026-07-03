import type { Response } from "express";

const DEFAULT_MESSAGE =
  "Le site est en cours de maintenance. Contactez le support technique pour la remise en marche.";

export function isMaintenanceMode(): boolean {
  const value = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
}

export function getMaintenanceMessage(): string {
  const custom = process.env.MAINTENANCE_MESSAGE?.trim();
  return custom || DEFAULT_MESSAGE;
}

export function getMaintenanceSupportEmail(): string {
  return process.env.MAINTENANCE_SUPPORT_EMAIL?.trim() || "support@davilla-rondeur.fr";
}

export function respondMaintenanceBlocked(res: Response): void {
  res.status(503).json({
    error: getMaintenanceMessage(),
    maintenance: true,
    supportEmail: getMaintenanceSupportEmail(),
  });
}

export function getMaintenanceStatusPayload() {
  return {
    enabled: isMaintenanceMode(),
    message: getMaintenanceMessage(),
    supportEmail: getMaintenanceSupportEmail(),
    paymentsBlocked: isMaintenanceMode(),
    adminLoginBlocked: isMaintenanceMode(),
  };
}
