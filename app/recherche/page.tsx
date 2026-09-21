import Link from 'next/link';
import { Check, Search as SearchIcon, SearchX } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { cn } from '@/lib/cn';
import { number } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { search } from '@/lib/data/search';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps<'/recherche'>) {
  const query = await searchParams;
  const q = typeof query.q === 'string' ? query.q : '';
  return { title: q ? `« ${q} »` : 'Recherche' };
}

export default async function SearchPage({ searchParams }: PageProps<'/recherche'>) {
  const query = await searchParams;
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const activeCategoryId = typeof query.categorie === 'string' ? query.categorie : undefined;
  const inStockOnly = query.stock === '1';

  const [{ products, total, facets, correctedTerm }, categories, cart] = await Promise.all([
    search({
      q: q || undefined,
      categoryIds: activeCategoryId ? [activeCategoryId] : undefined,
      inStockOnly,
      perPage: 48,
    }),
    getCategoryTree(),
    getCart(),
  ]);

  function filterHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (activeCategoryId) params.set('categorie', activeCategoryId);
    if (inStockOnly) params.set('stock', '1');
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/recherche?${qs}` : '/recherche';
  }

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
          <form action="/recherche" className="relative max-w-xl">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400" />
            <label htmlFor="q" className="sr-only">
              Rechercher un produit
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              autoFocus
              placeholder="Rechercher un canapé, du riz basmati…"
              className="h-12 w-full rounded-control border border-ink-300 pl-11 pr-4 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
            />
          </form>

          {q ? (
            <p className="mt-4 text-ink-600">
              {number(total)} résultat{total > 1 ? 's' : ''} pour « {q} »
            </p>
          ) : (
            <h1 className="mt-4 text-2xl font-bold text-ink-900">Tout le catalogue</h1>
          )}

          {correctedTerm ? (
            <p className="mt-1.5 text-sm text-ink-600">
              Résultats rapprochés de{' '}
              <Link href={filterHref({ q: correctedTerm })} className="font-medium text-cobalt-600 hover:underline">
                « {correctedTerm} »
              </Link>
              .
            </p>
          ) : null}
        </section>

        <section className="mx-auto max-w-7xl gap-10 px-4 py-8 lg:grid lg:grid-cols-[220px_1fr] lg:px-8">
          {/* --- Facettes ---------------------------------------------------- */}
          <aside className="mb-8 lg:mb-0">
            {facets.categories.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-ink-900 uppercase">Catégorie</h2>
                <ul className="mt-3 space-y-1">
                  <li>
                    <Link
                      href={filterHref({ categorie: undefined })}
                      className={cn(
                        'block rounded-control px-2.5 py-1.5 text-sm transition-colors duration-150',
                        !activeCategoryId ? 'bg-ink-100 font-medium text-ink-900' : 'text-ink-600 hover:bg-ink-100',
                      )}
                    >
                      Toutes
                    </Link>
                  </li>
                  {facets.categories.map((bucket) => (
                    <li key={bucket.value}>
                      <Link
                        href={filterHref({ categorie: bucket.value })}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-control px-2.5 py-1.5 text-sm transition-colors duration-150',
                          activeCategoryId === bucket.value ? 'bg-ink-100 font-medium text-ink-900' : 'text-ink-600 hover:bg-ink-100',
                        )}
                      >
                        <span>{bucket.label}</span>
                        <span className="text-ink-400">{bucket.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6">
              <Link
                href={filterHref({ stock: inStockOnly ? undefined : '1' })}
                className={cn(
                  'flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-sm transition-colors duration-150',
                  inStockOnly ? 'bg-ink-100 font-medium text-ink-900' : 'text-ink-600 hover:bg-ink-100',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded border',
                    inStockOnly ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-300',
                  )}
                >
                  {inStockOnly ? <Check className="size-3" /> : null}
                </span>
                En stock uniquement ({facets.availability.inStock})
              </Link>
            </div>
          </aside>

          {/* --- Résultats ----------------------------------------------------- */}
          <div>
            {products.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-clay-100">
                  <SearchX aria-hidden className="size-6 text-ink-500" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink-900">Aucun résultat</h2>
                <p className="mt-1.5 max-w-sm text-ink-600">
                  Essayez un terme plus général, ou vérifiez l’orthographe.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
