import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  fetchColissimoStatus,
  generateColissimoLabel,
} from "@/lib/colissimo-api";
import {
  getAdminGetOrderQueryKey,
  getAdminListOrdersQueryKey,
} from "@workspace/api-client-react";

type OrderWithShipment = {
  id: number;
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  colissimoLabelUrl?: string | null;
  packageWeightGrams?: number | null;
  shippedAt?: string | null;
};

export function OrderColissimoSection({
  order,
  onUpdated,
}: {
  order: OrderWithShipment;
  onUpdated?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weightGrams, setWeightGrams] = useState(
    order.packageWeightGrams ? String(order.packageWeightGrams) : "",
  );

  const { data: status } = useQuery({
    queryKey: ["admin", "colissimo", "status"],
    queryFn: fetchColissimoStatus,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateColissimoLabel(
        order.id,
        weightGrams ? Number.parseInt(weightGrams, 10) : undefined,
      ),
    onSuccess: (result) => {
      toast({ title: result.message, description: `Colis ${result.parcelNumber}` });
      void queryClient.invalidateQueries({ queryKey: getAdminGetOrderQueryKey(order.id) });
      void queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() });
      onUpdated?.();
    },
    onError: (error: Error & { data?: { error?: string } }) => {
      toast({
        title: "Colissimo",
        description: error.data?.error ?? error.message,
        variant: "destructive",
      });
    },
  });

  const trackingUrl = order.trackingNumber
    ? `https://www.laposte.fr/outils/suivre-vo-colis?code=${encodeURIComponent(order.trackingNumber)}`
    : null;

  return (
    <section className="border border-border overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
        <Package className="h-4 w-4" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Expédition Colissimo</p>
      </div>
      <div className="p-4 space-y-4">
        {!status?.configured ? (
          <p className="text-sm text-muted-foreground">
            Colissimo n&apos;est pas encore configuré sur le serveur. Ajoutez les variables{" "}
            <code className="text-xs">COLISSIMO_CONTRACT_NUMBER</code> et{" "}
            <code className="text-xs">COLISSIMO_PASSWORD</code> sur Render.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Expéditeur : {status.shipFrom.name}, {status.shipFrom.postalCode} {status.shipFrom.city}
            </p>
            {order.trackingNumber ? (
              <div className="space-y-2">
                <p className="font-medium">Suivi : {order.trackingNumber}</p>
                <div className="flex flex-wrap gap-2">
                  {trackingUrl ? (
                    <Button variant="outline" size="sm" className="rounded-none text-xs" asChild>
                      <a href={trackingUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Suivre le colis
                      </a>
                    </Button>
                  ) : null}
                  {order.colissimoLabelUrl ? (
                    <Button variant="outline" size="sm" className="rounded-none text-xs" asChild>
                      <a href={order.colissimoLabelUrl} target="_blank" rel="noreferrer">
                        Télécharger l&apos;étiquette
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {["paid", "shipped"].includes(order.status) ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                    Poids du colis (g)
                  </label>
                  <input
                    inputMode="numeric"
                    value={weightGrams}
                    onChange={(event) => setWeightGrams(event.target.value.replace(/\D/g, ""))}
                    placeholder={String(status.defaultWeightGrams)}
                    className="w-full border border-border px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  className="rounded-none text-xs uppercase tracking-widest"
                  disabled={generateMutation.isPending}
                  onClick={() => generateMutation.mutate()}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Génération...
                    </>
                  ) : order.trackingNumber ? (
                    "Regénérer l'étiquette"
                  ) : (
                    "Générer l'étiquette Colissimo"
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                L&apos;étiquette Colissimo est disponible pour les commandes payées ou expédiées.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
