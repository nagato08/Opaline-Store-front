'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderSummary } from '@/components/order/order-summary';
import { apiFetch, ApiError } from '@/lib/api';
import type { TrackedOrder } from '@/lib/data/orders';

/**
 * Recherche « numéro + courriel » côté client : elle appelle la même route
 * publique que le message d'accusé de réception, fortement limitée en
 * fréquence côté API contre le devinage d'identifiants.
 */
export function TrackingForm({ initialNumber }: { initialNumber: string }) {
  const [orderNumber, setOrderNumber] = useState(initialNumber);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle');
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('pending');
    setError('');
    setOrder(null);

    try {
      const found = await apiFetch<TrackedOrder>('/orders/track', {
        method: 'POST',
        body: JSON.stringify({ number: orderNumber, email }),
      });
      setOrder(found);
      setStatus('idle');
    } catch (caught) {
      setStatus('error');
      // Même message qu'un mauvais courriel ou un mauvais numéro : distinguer
      // les deux permettrait de deviner des numéros de commande valides.
      setError(
        caught instanceof ApiError && caught.status === 404
          ? 'Aucune commande ne correspond à ces informations.'
          : caught instanceof ApiError
            ? caught.message
            : 'Erreur inattendue. Réessayez.',
      );
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="numero" className="text-sm font-medium text-ink-900">
            Numéro de commande
          </label>
          <input
            id="numero"
            required
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="CMD-2026-000123"
            className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink-900">
            Courriel de la commande
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" size="lg" loading={status === 'pending'} disabled={status === 'pending'}>
            <Search aria-hidden className="size-4" />
            Retrouver ma commande
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {order ? (
        <div className="mt-10">
          <OrderSummary order={order} />
        </div>
      ) : null}
    </div>
  );
}
