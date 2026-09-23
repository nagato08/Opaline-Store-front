import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { getCategoryTree, listProducts } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Nouveautés' };

/**
 * Derniers produits entrés au catalogue.
 *
 * L'adresse était liée depuis le menu principal et deux fois depuis la page
 * d'accueil, sans qu'aucune page ne réponde : trois liens vers un 404 sur
 * toutes les pages du site.
 */
export default async function NewArrivalsPage() {
  const [{ products, total }, categories, cart] = await Promise.all([
    listProducts({ sort: 'newest', perPage: 24 }),
    getCategoryTree(),
    getCart(),
  ]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
          <nav aria-label="Fil d’Ariane" className="text-sm text-ink-500">
            <Link href="/" className="hover:text-ink-800 hover:underline">
              Accueil
            </Link>
            <span aria-hidden className="mx-1.5">
              /
            </span>
            <span className="text-ink-700" aria-current="page">
              Nouveautés
            </span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">Nouveautés</h1>
          <p className="mt-2 max-w-xl text-ink-600">
            Les derniers articles entrés au catalogue, du plus récent au plus ancien.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          {products.length === 0 ? (
            <EmptyShelf
              title="Rien de neuf pour l’instant"
              description="Le catalogue s’étoffe régulièrement. Revenez voir, ou parcourez les rayons."
            />
          ) : (
            <>
              <p className="sr-only">{total} articles</p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

function EmptyShelf({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-clay-100">
        <Sparkles aria-hidden className="size-6 text-ink-500" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-1.5 max-w-sm text-ink-600">{description}</p>
      <Link href="/" className="mt-5 text-sm font-medium text-cobalt-600 hover:underline">
        Revenir à l’accueil
      </Link>
    </div>
  );
}
