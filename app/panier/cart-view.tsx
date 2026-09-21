'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { ImageOff, Loader2, Minus, Plus, ShoppingBag, Trash2, TriangleAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { money, number } from '@/lib/format';
import { ApiError } from '@/lib/api';
import {
  applyCoupon,
  removeCartItem,
  removeCoupon,
  updateCartItem,
  type Cart,
} from '@/lib/data/cart';

/**
 * Panier interactif.
 *
 * Chaque mutation (quantité, suppression, code promo) renvoie le panier
 * recalculé au complet : l'état local se remplace par la réponse plutôt que
 * de deviner un nouveau total côté client, conformément à la règle du projet
 * — aucune arithmétique monétaire hors formatage.
 */
export function CartView({ initialCart }: { initialCart: Cart }) {
  const [cart, setCart] = useState(initialCart);
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isPending, startTransition] = useTransition();

  function mutateItem(itemId: string, action: () => Promise<Cart>) {
    setPendingItem(itemId);
    startTransition(async () => {
      try {
        setCart(await action());
      } catch {
        // Le panier garde son dernier état connu ; l'API reste la source de
        // vérité au prochain chargement de page.
      } finally {
        setPendingItem(null);
      }
    });
  }

  function submitCoupon(event: React.FormEvent) {
    event.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');

    startTransition(async () => {
      try {
        setCart(await applyCoupon(couponCode.trim()));
        setCouponCode('');
      } catch (error) {
        setCouponError(error instanceof ApiError ? error.message : 'Erreur inattendue.');
      }
    });
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-clay-100">
          <ShoppingBag aria-hidden className="size-6 text-ink-500" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink-900">Votre panier est vide</h1>
        <p className="mt-1.5 max-w-sm text-ink-600">
          Parcourez le catalogue pour trouver de quoi le remplir.
        </p>
        <ButtonLink href="/" size="lg" className="mt-6">
          Continuer mes achats
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:items-start lg:gap-14">
      {/* --- Lignes ---------------------------------------------------- */}
      <ul className="min-w-0 divide-y divide-ink-200/70 lg:col-span-2">
        {cart.lines.map((line) => {
          const rowPending = isPending && pendingItem === line.cartItemId;

          return (
            <li key={line.cartItemId} className="flex gap-4 py-6 first:pt-0">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-card bg-clay-100 sm:size-28">
                {line.imageUrl ? (
                  <Image src={line.imageUrl} alt={line.name} fill sizes="112px" className="object-cover" />
                ) : (
                  <div aria-hidden className="grid size-full place-items-center">
                    <ImageOff className="size-6 text-ink-400" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{line.name}</p>
                    {line.variantName ? (
                      <p className="mt-0.5 text-sm text-ink-500">{line.variantName}</p>
                    ) : null}
                    <p className="mt-0.5 font-mono text-xs text-ink-400" translate="no">
                      {line.sku}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Retirer ${line.name} du panier`}
                    disabled={isPending}
                    onClick={() => mutateItem(line.cartItemId, () => removeCartItem(line.cartItemId))}
                    className="shrink-0 rounded-control p-2 text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-danger disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>

                {!line.hasEnoughStock ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-danger">
                    <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
                    Stock insuffisant à cette quantité.
                  </p>
                ) : null}
                {line.priceChanged ? (
                  <p className="mt-1.5 text-sm text-saffron">Le tarif de cet article a changé.</p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <div className="flex h-11 items-center rounded-control border border-ink-300">
                    <button
                      type="button"
                      aria-label="Diminuer la quantité"
                      disabled={rowPending}
                      onClick={() =>
                        mutateItem(line.cartItemId, () =>
                          updateCartItem(line.cartItemId, Math.max(0, line.quantity - 1)),
                        )
                      }
                      className="grid size-11 shrink-0 place-items-center text-ink-600 transition-colors duration-150 hover:bg-ink-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Minus aria-hidden className="size-4" />
                    </button>
                    <span data-numeric className="min-w-10 px-1 text-center font-mono text-sm">
                      {rowPending ? <Loader2 aria-hidden className="mx-auto size-4 animate-spin" /> : number(line.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label="Augmenter la quantité"
                      disabled={rowPending}
                      onClick={() =>
                        mutateItem(line.cartItemId, () => updateCartItem(line.cartItemId, line.quantity + 1))
                      }
                      className="grid size-11 shrink-0 place-items-center text-ink-600 transition-colors duration-150 hover:bg-ink-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Plus aria-hidden className="size-4" />
                    </button>
                  </div>

                  <p data-price className="font-mono text-lg font-semibold text-ink-900">
                    {money(line.lineTotalCents, cart.currencyCode)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* --- Récapitulatif ------------------------------------------------ */}
      <div className="rounded-card bg-clay-50 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold text-ink-900">Récapitulatif</h2>

        <dl className="mt-4 space-y-2.5 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-ink-600">Sous-total</dt>
            <dd data-price className="font-medium text-ink-900">
              {money(cart.subtotalCents, cart.currencyCode)}
            </dd>
          </div>

          {cart.discountCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink-600">Remises</dt>
              <dd data-price className="font-medium text-success">
                −{money(cart.discountCents, cart.currencyCode)}
              </dd>
            </div>
          ) : null}

          {cart.ecoTaxCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink-600">dont éco-participation</dt>
              <dd data-price className="text-ink-500">
                {money(cart.ecoTaxCents, cart.currencyCode)}
              </dd>
            </div>
          ) : null}

          <div className="flex justify-between">
            <dt className="text-ink-600">Livraison</dt>
            <dd data-price className="font-medium text-ink-900">
              {cart.requiresShipping ? 'Calculée à l’étape suivante' : 'Non requise'}
            </dd>
          </div>

          {!cart.pricesIncludeTax ? (
            <div className="flex justify-between">
              <dt className="text-ink-600">Taxes</dt>
              <dd data-price className="font-medium text-ink-900">
                {money(cart.taxCents, cart.currencyCode)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-ink-200 pt-4">
          <span className="font-medium text-ink-900">
            Total {cart.pricesIncludeTax ? 'TTC' : 'HT'}
          </span>
          <span data-price className="font-mono text-xl font-semibold text-ink-900">
            {money(cart.totalCents, cart.currencyCode)}
          </span>
        </div>

        {cart.discounts.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {cart.discounts.map((discount) => (
              <li key={discount.promotionId} className="flex items-center justify-between text-sm text-success">
                <span>{discount.label}</span>
                {discount.code ? (
                  <button
                    type="button"
                    onClick={() => mutateItem('coupon', () => removeCoupon(discount.code as string))}
                    className="text-xs text-ink-500 underline underline-offset-2 hover:text-ink-800"
                  >
                    Retirer
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={submitCoupon} className="mt-5 flex gap-2">
          <label htmlFor="coupon" className="sr-only">
            Code promo
          </label>
          <input
            id="coupon"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Code promo"
            className="h-11 min-w-0 flex-1 rounded-control border border-ink-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-11 shrink-0 rounded-control border border-ink-300 px-4 text-sm font-medium text-ink-700 transition-colors duration-150 hover:bg-ink-100 disabled:pointer-events-none disabled:opacity-50"
          >
            Appliquer
          </button>
        </form>
        {couponError ? <p className="mt-1.5 text-sm text-danger">{couponError}</p> : null}
        {cart.rejectedCoupons.map((rejected) => (
          <p key={rejected.code} className="mt-1.5 text-sm text-danger">
            {rejected.code} : {rejected.reason}
          </p>
        ))}

        <ButtonLink
          href="/commande"
          size="lg"
          className="mt-6 w-full"
          aria-disabled={cart.hasStockIssue}
          onClick={(event) => {
            if (cart.hasStockIssue) event.preventDefault();
          }}
        >
          Passer commande
        </ButtonLink>
        {cart.hasStockIssue ? (
          <p className="mt-2 text-center text-sm text-danger">
            Corrigez les quantités en rupture avant de continuer.
          </p>
        ) : null}
      </div>
    </div>
  );
}
