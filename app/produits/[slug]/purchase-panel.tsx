'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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

  /* Suit le bouton d'achat pour savoir s'il est encore à l'écran. Un
     observateur plutôt qu'un écouteur de défilement : la position se lit sans
     forcer de calcul de mise en page à chaque pixel parcouru. */
  const buyRef = useRef<HTMLButtonElement>(null);
  const [buyOutOfView, setBuyOutOfView] = useState(false);

  useEffect(() => {
    const target = buyRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBuyOutOfView(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

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

      /* Le compteur de l'en-tête vient du rendu serveur : sans ce
         rafraîchissement il reste figé, et l'article semble ne pas avoir été
         ajouté. C'est aussi le premier appel qui pose le cookie de panier dans
         le navigateur — le serveur ne peut donc pas le voir avant. */
      router.refresh();
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

      {/* La quantité s'affiche pour **tout** produit, pas seulement pour ceux
          vendus au poids. Sans elle, acheter deux chaises obligeait à cliquer
          deux fois sur « Ajouter au panier », et le second clic ajoutait une
          unité de plus sans que le champ le montre.

          L'unité ne figure dans le libellé que lorsqu'elle existe : « Quantité
          (pièces) » est du bruit sur un canapé. */}
      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-medium text-ink-900">
          {unit ? `Quantité (${unit})` : 'Quantité'}
        </label>
        <input
          id="quantity"
          type="number"
          min={min}
          step={step}
          /* Plafonné au stock réel : l'API refuserait de toute façon, mais
             l'apprendre après avoir rempli le tunnel est pénible. */
          max={variant?.stock.available && variant.stock.available > 0 ? variant.stock.available : undefined}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          /* `decimal` seulement pour la vente au poids : sur un article à la
             pièce, le clavier numérique du téléphone n'a pas à proposer une
             virgule. */
          inputMode={variant?.measure ? 'decimal' : 'numeric'}
          className="h-11 w-28 rounded-control border border-ink-300 px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
        />
      </div>

      <Button
        ref={buyRef}
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

      {/* Rappel d'achat sur téléphone.
          La fiche fait trois écrans de haut : passé la description, le bouton
          était loin derrière et il fallait remonter pour acheter. La barre ne
          paraît que lorsque le vrai bouton est sorti du champ, pour ne jamais
          en afficher deux à la fois. */}
      {buyOutOfView && variant?.price ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop sm:hidden">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-600">{product.name}</p>
              <p data-price className="text-lg font-semibold text-ink-900">
                {money(variant.price.amountCents, variant.price.currencyCode)}
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              disabled={!variant.stock.isAvailable || status === 'pending'}
              onClick={addToCart}
            >
              {status === 'pending' ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
              {status === 'done' ? 'Ajouté' : 'Ajouter'}
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {/* Confirmation annoncée aux lecteurs d'écran et doublée d'un chemin
          vers la suite : « Ajouté au panier » sur un bouton ne dit pas où
          aller ensuite. */}
      {status === 'done' ? (
        <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700">
          <span className="text-success">Ajouté à votre panier.</span>
          <Link href="/panier" className="font-medium text-cobalt-600 hover:underline">
            Voir le panier
          </Link>
          <Link href="/commande" className="font-medium text-cobalt-600 hover:underline">
            Commander
          </Link>
        </p>
      ) : null}

      {variant ? (
        <p className="font-mono text-xs text-ink-500" translate="no">
          Référence {variant.sku}
          {variant.stock.isAvailable ? ` · ${number(variant.stock.available)} en stock` : ''}
        </p>
      ) : null}
    </div>
  );
}
