import { useQuery } from "@tanstack/react-query";
import { fetchMaintenanceStatus } from "@/lib/maintenance-api";

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: ["maintenance-status"],
    queryFn: fetchMaintenanceStatus,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
