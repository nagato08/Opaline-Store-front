'use client';

import { useMemo, useState } from 'react';
import { Check, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { money, number, unitPrice } from '@/lib/format';
import { apiFetch, ApiError } from '@/lib/api';
import type { ProductDetail, ProductVariant } from '@/lib/data/catalog';

/**
 * Sélection de déclinaison, prix et ajout au panier.
 *
 * Client Component : c'est la seule partie de la fiche qui a besoin d'état
 * (déclinaison choisie, quantité, appel réseau). Le reste de la page reste un
 * Server Component.
 */
export function PurchasePanel({ product }: { product: ProductDetail }) {
  const hasOptions = product.options.length > 0 && product.variants.length > 1;

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const first = product.variants[0];
    const initial: Record<string, string> = {};
    if (first) {
      for (const option of product.options) {
        const valueId = first.optionValueIds.find((id) =>
          option.values.some((value) => value.id === id),
        );
        if (valueId) initial[option.id] = valueId;
      }
    }
    return initial;
  });

  const variant = useMemo<ProductVariant | undefined>(() => {
    if (!hasOptions) return product.variants[0];

    return product.variants.find((candidate) =>
      Object.values(selection).every((valueId) => candidate.optionValueIds.includes(valueId)),
    );
  }, [hasOptions, product.variants, selection]);

  const [quantity, setQuantity] = useState<number>(variant?.measure?.step ?? 1);
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const step = variant?.measure?.step ?? 1;
  const min = variant?.measure?.min ?? step;
  const unit = variant?.measure?.unit ?? null;

  async function addToCart() {
    if (!variant) return;
    setStatus('pending');
    setError('');

    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId: variant.id, quantity }),
      });
      setStatus('done');
    } catch (caught) {
      setStatus('error');
      setError(caught instanceof ApiError ? caught.message : 'Erreur inattendue. Réessayez.');
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {hasOptions
        ? product.options.map((option) => (
            <fieldset key={option.id}>
              <legend className="text-sm font-medium text-ink-900">{option.name}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const active = selection[option.id] === value.id;
                  const available = product.variants.some(
                    (candidate) =>
                      candidate.optionValueIds.includes(value.id) && candidate.stock.isAvailable,
                  );

                  return (
                    <button
                      key={value.id}
                      type="button"
                      disabled={!available}
                      aria-pressed={active}
                      onClick={() => {
                        setSelection((current) => ({ ...current, [option.id]: value.id }));
                        setStatus('idle');
                      }}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150',
                        active
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-300 text-ink-700 hover:border-ink-500',
                        !available && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))
        : null}

      {variant?.price ? (
        <div>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span data-price className="text-3xl font-semibold text-ink-900">
              {money(variant.price.amountCents, variant.price.currencyCode)}
            </span>
            {variant.price.compareAtCents && variant.price.compareAtCents > variant.price.amountCents ? (
              <span data-price className="text-lg text-ink-500 line-through">
                {money(variant.price.compareAtCents, variant.price.currencyCode)}
              </span>
            ) : null}
          </p>
          {variant.measure?.netContent && variant.measure.unitPriceCents ? (
            <p data-price className="mt-1 text-sm text-ink-500">
              {unitPrice(
                variant.price.amountCents,
                variant.measure.netContent,
                variant.measure.netContentUnit ?? variant.measure.unit ?? 'unité',
                variant.price.currencyCode,
              )}
            </p>
          ) : null}
          {product.compliance.ecoTaxCents > 0 ? (
            <p className="mt-1 text-sm text-ink-500">
              dont {money(product.compliance.ecoTaxCents, variant.price.currencyCode)} d’éco-participation
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-ink-500">Prix indisponible pour le moment.</p>
      )}

      {variant && !variant.stock.isAvailable ? (
        <p className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <ShieldAlert aria-hidden className="size-4 shrink-0" />
          Épuisé pour le moment.
        </p>
      ) : null}

      {variant?.measure ? (
        <div className="flex items-center gap-3">
          <label htmlFor="quantity" className="text-sm font-medium text-ink-900">
            Quantité ({unit})
          </label>
          <input
            id="quantity"
            type="number"
            min={min}
            step={step}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            inputMode="decimal"
            className="h-11 w-28 rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          />
        </div>
      ) : null}

      <Button
        size="lg"
        className="w-full sm:w-auto sm:px-10"
        disabled={!variant?.stock.isAvailable || status === 'pending'}
        onClick={addToCart}
      >
        {status === 'pending' ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {status === 'done' ? (
          <>
            <Check aria-hidden className="size-4" />
            Ajouté au panier
          </>
        ) : (
          'Ajouter au panier'
        )}
      </Button>

      {status === 'error' ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {variant ? (
        <p className="font-mono text-xs text-ink-400" translate="no">
          Référence {variant.sku}
          {variant.stock.isAvailable ? ` · ${number(variant.stock.available)} en stock` : ''}
        </p>
      ) : null}
    </div>
  );
}
