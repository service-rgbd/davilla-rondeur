const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  shipped: "bg-blue-100 text-blue-900 border-blue-200",
  delivered: "bg-violet-100 text-violet-900 border-violet-200",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-sans font-semibold uppercase tracking-widest border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function getOrderStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payée" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
] as const;
