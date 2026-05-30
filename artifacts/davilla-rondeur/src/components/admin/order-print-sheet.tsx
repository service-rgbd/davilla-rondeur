import type { Order } from "@workspace/api-client-react";
import { SHIP_FROM, formatCountry } from "@/lib/ship-from";

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function AddressBlock({
  title,
  name,
  line1,
  line2,
  postalCode,
  city,
  country,
  phone,
  email,
}: {
  title: string;
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  return (
    <section className="order-print-address">
      <h2 className="order-print-label">{title}</h2>
      {name ? <p className="order-print-name">{name}</p> : null}
      {line1 ? <p>{line1}</p> : null}
      {line2 ? <p>{line2}</p> : null}
      {postalCode || city ? (
        <p>
          {[postalCode, city].filter(Boolean).join(" ")}
        </p>
      ) : null}
      {country ? <p>{formatCountry(country)}</p> : null}
      {phone ? <p>Tél. {phone}</p> : null}
      {email ? <p className="order-print-muted">{email}</p> : null}
    </section>
  );
}

export function OrderPrintSheet({ order }: { order: Order }) {
  const hasShipping = Boolean(order.shippingAddress?.line1);

  return (
    <article className="order-print-sheet" data-order-id={order.id}>
      <header className="order-print-header">
        <div>
          <p className="order-print-brand">Davilla Rondeur</p>
          <h1 className="order-print-title">Bon de préparation</h1>
        </div>
        <div className="order-print-meta">
          <p className="order-print-order-id">Commande #{order.id}</p>
          <p>{formatDate(order.paidAt ?? order.createdAt)}</p>
          <p className="order-print-status">Statut : {order.status}</p>
        </div>
      </header>

      <div className="order-print-addresses">
        <AddressBlock
          title="Expéditeur"
          name={SHIP_FROM.name}
          line1={SHIP_FROM.line1}
          postalCode={SHIP_FROM.postalCode}
          city={SHIP_FROM.city}
          country={SHIP_FROM.country}
          email={SHIP_FROM.email}
        />

        {hasShipping ? (
          <AddressBlock
            title="Destinataire"
            name={order.shippingAddress?.name}
            line1={order.shippingAddress?.line1}
            line2={order.shippingAddress?.line2}
            postalCode={order.shippingAddress?.postalCode}
            city={order.shippingAddress?.city}
            country={order.shippingAddress?.country}
            phone={order.shippingAddress?.phone}
            email={order.email}
          />
        ) : (
          <section className="order-print-address order-print-missing">
            <h2 className="order-print-label">Destinataire</h2>
            <p className="order-print-warning">
              Adresse de livraison non enregistrée pour cette commande.
            </p>
            <p className="order-print-muted">Email client : {order.email}</p>
            <p className="order-print-muted text-xs mt-2">
              Les commandes payées après mise à jour Stripe enregistrent l&apos;adresse
              automatiquement. Sinon, contactez le client.
            </p>
          </section>
        )}
      </div>

      <section className="order-print-items">
        <h2 className="order-print-label">Contenu du colis</h2>
        <table className="order-print-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Qté</th>
              <th className="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.productName}
                  {item.size || item.color ? (
                    <span className="order-print-muted block text-xs">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </td>
                <td>{item.quantity}</td>
                <td className="text-right">{formatEuro(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="order-print-total">
          Total TTC : <strong>{formatEuro(order.total)}</strong>
        </p>
      </section>

      <footer className="order-print-footer">
        <p>Colis discret — Davilla Rondeur · {SHIP_FROM.phone}</p>
      </footer>
    </article>
  );
}
