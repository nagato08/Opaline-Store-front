'use client';

import { useState } from 'react';
import { PackageOpen, Snowflake, Truck } from 'lucide-react';
import { money } from '@/lib/format';
import { removeCartItem, type Cart, type ShippingConstraint, type ShippingGroup } from '@/lib/data/cart';

/**
 * Panier livrable, mais pas en une fois.
 *
 * Un meuble hors gabarit et une denrée réfrigérée n'ont aucun transporteur en
 * commun : le tunnel affichait donc une liste de modes vide, sans dire pourquoi,
 * et le client restait bloqué.
 *
 * Ce panneau nomme les deux groupes, montre ce qu'ils coûtent chacun, et
 * propose de n'en commander qu'un maintenant. Les articles écartés retournent
 * au catalogue, pas à la poubelle : ils se recommandent en deux clics juste
 * après, et on le dit.
 *
 * La vraie expédition multiple — une commande, deux colis, deux dates — viendra
 * ensuite ; elle demande que la commande porte plusieurs modes de livraison.
 */
const LABELS: Record<ShippingConstraint, { titre: string; motif: string; icone: typeof Truck }> = {
  COLD_CHAIN: {
    titre: 'Produits frais',
    motif: 'Ils voyagent en camion réfrigéré, qui ne prend pas les articles encombrants.',
    icone: Snowflake,
  },
  OVERSIZED: {
    titre: 'Articles encombrants',
    motif: 'Ils partent par un transporteur spécialisé, qui n’assure pas la chaîne du froid.',
    icone: Truck,
  },
  STANDARD: {
    titre: 'Reste de la commande',
    motif: 'Colis standard.',
    icone: PackageOpen,
  },
};

export function SplitShippingNotice({
  cart,
  groups,
  onCartChange,
}: {
  cart: Cart;
  groups: ShippingGroup[];
  /** Le tunnel recharge ses options après retrait : le panier a changé. */
  onCartChange: (cart: Cart) => void;
}) {
  const [pending, setPending] = useState<ShippingConstraint | null>(null);

  function linesOf(group: ShippingGroup) {
    return cart.lines.filter((line) => group.cartItemIds.includes(line.cartItemId));
  }

  /** Retire les articles des *autres* groupes pour ne commander que celui-ci. */
  async function keepOnly(group: ShippingGroup) {
    setPending(group.constraint);

    try {
      const toRemove = groups
        .filter((other) => other.constraint !== group.constraint)
        .flatMap((other) => other.cartItemIds);

      let updated = cart;
      for (const itemId of toRemove) updated = await removeCartItem(itemId);

      onCartChange(updated);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-card border border-warning/30 bg-warning-soft p-5">
      <h3 className="font-display text-lg font-semibold text-ink-900">
        Votre commande demande deux livraisons
      </h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700">
        Aucun transporteur ne prend à la fois vos articles encombrants et vos produits frais.
        Choisissez ce que vous souhaitez recevoir en premier — le reste vous attendra au catalogue,
        et se recommande en deux clics.
      </p>

      <ul className="mt-5 space-y-3">
        {groups.map((group) => {
          const { titre, motif, icone: Icone } = LABELS[group.constraint];
          const lines = linesOf(group);
          const cheapest = group.options.reduce<number | null>(
            (best, option) => (best === null || option.priceCents < best ? option.priceCents : best),
            null,
          );

          return (
            <li key={group.constraint} className="rounded-xl bg-white p-4">
              <div className="flex items-start gap-3">
                <Icone aria-hidden className="mt-0.5 size-5 shrink-0 text-ink-500" />

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900">{titre}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{motif}</p>

                  <ul className="mt-2 text-sm text-ink-700">
                    {lines.map((line) => (
                      <li key={line.cartItemId}>
                        {line.name}
                        <span className="text-ink-500"> × {line.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  {cheapest !== null ? (
                    <p className="mt-2 text-sm text-ink-600">
                      Livraison à partir de{' '}
                      <span className="font-medium text-ink-900">
                        {money(cheapest, cart.currencyCode)}
                      </span>
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => keepOnly(group)}
                  disabled={pending !== null}
                  className="h-10 shrink-0 rounded-xl bg-ink-900 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-ink-800 disabled:opacity-50"
                >
                  {pending === group.constraint ? 'Mise à jour…' : 'Commander ceci'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
