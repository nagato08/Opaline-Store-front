'use client';

import { useState } from 'react';
import { PackageOpen, Snowflake, Truck } from 'lucide-react';
import { money } from '@/lib/format';
import type { Cart, ShippingConstraint, ShippingGroup } from '@/lib/data/cart';

/**
 * Panier livrable, mais pas en une fois.
 *
 * Un meuble hors gabarit et une denrée réfrigérée n'ont aucun transporteur en
 * commun : le tunnel affichait une liste de modes vide, sans dire pourquoi, et
 * le client restait bloqué.
 *
 * Il choisit désormais un mode **par groupe** et commande le tout en une fois.
 * La commande partira en deux colis, chacun avec sa date — c'est dit
 * explicitement, parce qu'un client qui reçoit la moitié de sa commande sans
 * avertissement croit à une erreur.
 */
const LABELS: Record<ShippingConstraint, { titre: string; motif: string; icone: typeof Truck }> = {
  COLD_CHAIN: {
    titre: 'Produits frais',
    motif: 'Camion réfrigéré, qui ne prend pas les articles encombrants.',
    icone: Snowflake,
  },
  OVERSIZED: {
    titre: 'Articles encombrants',
    motif: 'Transporteur spécialisé, qui n’assure pas la chaîne du froid.',
    icone: Truck,
  },
  STANDARD: {
    titre: 'Reste de la commande',
    motif: 'Colis standard.',
    icone: PackageOpen,
  },
};

export type GroupSelection = Record<string, string>;

export function SplitShippingNotice({
  cart,
  groups,
  selection,
  onSelect,
}: {
  cart: Cart;
  groups: ShippingGroup[];
  /** Mode retenu par contrainte ; le parent en a besoin pour valider l'étape. */
  selection: GroupSelection;
  onSelect: (constraint: ShippingConstraint, methodId: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const total = groups.reduce((sum, group) => {
    const chosen = group.options.find((option) => option.methodId === selection[group.constraint]);
    return sum + (chosen?.priceCents ?? 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-warning/30 bg-warning-soft p-4">
        <p className="text-[15px] leading-relaxed text-ink-800">
          <span className="font-medium">Votre commande partira en {groups.length} colis.</span>{' '}
          Aucun transporteur ne prend à la fois vos articles encombrants et vos produits frais.
          Choisissez la livraison de chacun — vous ne passez qu’une seule commande.
        </p>
      </div>

      {groups.map((group) => {
        const { titre, motif, icone: Icone } = LABELS[group.constraint];
        const lines = cart.lines.filter((line) => group.cartItemIds.includes(line.cartItemId));
        const expanded = open === group.constraint;

        return (
          <fieldset key={group.constraint} className="rounded-card border border-ink-200 p-4">
            <legend className="flex items-center gap-2 px-1 text-sm font-medium text-ink-900">
              <Icone aria-hidden className="size-4 text-ink-500" />
              {titre}
            </legend>

            <p className="text-sm text-ink-600">{motif}</p>

            {/* Le détail est replié : sur un panier de vingt articles, la
                liste complète noierait le choix du mode, qui est l'objet de
                l'écran. */}
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : group.constraint)}
              aria-expanded={expanded}
              className="mt-1 text-sm text-cobalt-600 hover:underline"
            >
              {lines.length} article{lines.length > 1 ? 's' : ''}
              {expanded ? ' — masquer' : ' — voir'}
            </button>

            {expanded ? (
              <ul className="mt-2 text-sm text-ink-700">
                {lines.map((line) => (
                  <li key={line.cartItemId}>
                    {line.name}
                    <span className="text-ink-500"> × {line.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 space-y-2">
              {group.options.map((option) => (
                <label
                  key={option.methodId}
                  className={
                    selection[group.constraint] === option.methodId
                      ? 'flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-ink-900 bg-clay-50 p-3'
                      : 'flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-ink-200 p-3 hover:border-ink-400'
                  }
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`livraison-${group.constraint}`}
                      value={option.methodId}
                      checked={selection[group.constraint] === option.methodId}
                      onChange={() => onSelect(group.constraint, option.methodId)}
                      className="size-4 accent-ink-900"
                    />
                    <span className="text-[15px] text-ink-900">{option.name}</span>
                  </span>

                  <span className="text-[15px] font-medium text-ink-900">
                    {option.priceCents === 0
                      ? 'Offerte'
                      : money(option.priceCents, cart.currencyCode)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      <p className="text-right text-sm text-ink-600">
        Livraison des {groups.length} colis :{' '}
        <span className="font-medium text-ink-900">
          {total === 0 ? 'offerte' : money(total, cart.currencyCode)}
        </span>
      </p>
    </div>
  );
}
