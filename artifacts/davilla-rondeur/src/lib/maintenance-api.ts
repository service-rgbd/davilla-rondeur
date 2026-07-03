import { customFetch } from "@workspace/api-client-react";

export type MaintenanceStatus = {
  enabled: boolean;
  message: string;
  supportEmail: string;
  paymentsBlocked: boolean;
  adminLoginBlocked: boolean;
};

export function fetchMaintenanceStatus() {
  return customFetch<MaintenanceStatus>("/api/maintenance");
}
