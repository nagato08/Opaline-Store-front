'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Brand } from '@/lib/data/catalog';

/**
 * Tri et filtres d'un rayon.
 *
 * Tout l'état vit dans l'URL, comme les onglets de sous-rayon juste au-dessus :
 * un filtrage se partage, se met en favori, et le bouton « précédent » le
 * défait. Un état en mémoire aurait perdu la sélection au premier retour
 * depuis une fiche produit.
 *
 * Les marques proposées sont celles réellement présentes dans le rayon
 * affiché — offrir « Gourmandine » dans le mobilier ne mène qu'à une grille
 * vide.
 */
const SORTS = [
  { value: '', label: 'Tri par défaut' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'name_asc', label: 'Ordre alphabétique' },
] as const;

export function FilterBar({ brands, resultCount }: { brands: Brand[]; resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selectedBrands = params.getAll('marque');
  const inStockOnly = params.get('stock') === '1';
  const sort = params.get('tri') ?? '';
  const filterCount = selectedBrands.length + (inStockOnly ? 1 : 0);

  /** Réécrit l'URL sans recharger la page ni perdre le rayon courant. */
  function apply(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    router.push(next.size > 0 ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function toggleBrand(id: string) {
    apply((next) => {
      const kept = next.getAll('marque').filter((value) => value !== id);
      next.delete('marque');
      for (const value of kept) next.append('marque', value);
      if (!selectedBrands.includes(id)) next.append('marque', id);
    });
  }

  return (
    <div className="mt-6 border-y border-ink-200/70 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <SlidersHorizontal aria-hidden className="size-4 text-ink-500" />
          Affiner
          {filterCount > 0 ? (
            <span className="rounded-full bg-ink-900 px-2 py-0.5 text-xs text-white" data-numeric>
              {filterCount}
            </span>
          ) : null}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="tri" className="text-sm text-ink-600">
            Trier
          </label>
          <select
            id="tri"
            value={sort}
            onChange={(event) =>
              apply((next) => {
                if (event.target.value) next.set('tri', event.target.value);
                else next.delete('tri');
              })
            }
            className="h-10 rounded-control border border-ink-300 bg-surface px-3 text-sm text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) =>
              apply((next) => {
                if (event.target.checked) next.set('stock', '1');
                else next.delete('stock');
              })
            }
            className="size-4 accent-ink-900"
          />
          En stock uniquement
        </label>

        {filterCount > 0 ? (
          <button
            type="button"
            onClick={() =>
              apply((next) => {
                next.delete('marque');
                next.delete('stock');
              })
            }
            className="flex items-center gap-1.5 text-sm text-cobalt-600 hover:underline"
          >
            <X aria-hidden className="size-3.5" />
            Tout effacer
          </button>
        ) : null}

        <p className="ml-auto text-sm text-ink-500" aria-live="polite">
          {resultCount} article{resultCount > 1 ? 's' : ''}
        </p>
      </div>

      {brands.length > 1 ? (
        <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1">
          <div className="flex min-w-max items-center gap-2">
            {brands.map((brand) => {
              const active = selectedBrands.includes(brand.id);

              return (
                <button
                  key={brand.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleBrand(brand.id)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors duration-150',
                    active
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-300 text-ink-700 hover:border-ink-500',
                  )}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
