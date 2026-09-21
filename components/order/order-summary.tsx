import { Package } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { money, number } from '@/lib/format';
import type { TrackedOrder } from '@/lib/data/orders';

export const ORDER_STATUS_LABELS: Record<TrackedOrder['status'], string> = {
  PENDING: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const ORDER_STATUS_TONES: Record<TrackedOrder['status'], BadgeTone> = {
  PENDING: 'neutral',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

/** Détail d'une commande — partagé entre la confirmation et le suivi. */
export function OrderSummary({ order }: { order: TrackedOrder }) {
  const shipping = order.addresses.find((address) => address.type === 'SHIPPING');
  const shipment = order.shipments[0];

  return (
    <>
      <div className="rounded-card border border-ink-200/70">
        <div className="flex items-center justify-between border-b border-ink-200/70 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">Articles</h2>
          <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>
        <ul className="divide-y divide-ink-200/70">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{item.name}</p>
                <p className="mt-0.5 text-sm text-ink-500">
                  {number(Number(item.quantity))} × {money(item.unitPriceCents, order.currencyCode)}
                </p>
              </div>
              <span data-price className="shrink-0 font-medium text-ink-900">
                {money(item.totalCents, order.currencyCode)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-ink-200/70 px-6 py-4 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Sous-total</span>
            <span data-price>{money(order.subtotalCents, order.currencyCode)}</span>
          </div>
          {order.discountCents > 0 ? (
            <div className="flex justify-between text-success">
              <span>Remises</span>
              <span data-price>−{money(order.discountCents, order.currencyCode)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-600">
            <span>Livraison</span>
            <span data-price>{money(order.shippingCents, order.currencyCode)}</span>
          </div>
          {!order.pricesIncludeTax ? (
            <div className="flex justify-between text-ink-600">
              <span>Taxes</span>
              <span data-price>{money(order.taxCents, order.currencyCode)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-ink-200/70 pt-2 text-base font-semibold text-ink-900">
            <span>Total {order.pricesIncludeTax ? 'TTC' : 'HT'}</span>
            <span data-price className="font-mono">{money(order.totalCents, order.currencyCode)}</span>
          </div>
        </div>
      </div>

      {shipping ? (
        <div className="mt-6 flex items-start gap-3 rounded-card bg-clay-50 p-5">
          <Package aria-hidden className="mt-0.5 size-5 shrink-0 text-ink-500" />
          <div className="text-sm text-ink-700">
            <p className="font-medium text-ink-900">Livraison</p>
            <p className="mt-0.5">
              {shipping.firstName} {shipping.lastName}
              <br />
              {shipping.line1}
              {shipping.line2 ? <>, {shipping.line2}</> : null}
              <br />
              {shipping.postalCode} {shipping.city}, {shipping.countryCode}
            </p>
            {shipment?.trackingNumber ? (
              <p className="mt-2 font-mono text-xs text-ink-500" translate="no">
                Suivi transporteur : {shipment.trackingNumber}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
