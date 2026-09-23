import Link from 'next/link';
import { Tag } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { getCategoryTree, listProducts } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Promotions' };

/**
 * Articles au prix barré.
 *
 * L'API n'expose pas de filtre « en promotion » : le prix barré
 * (`compareAtCents`) vit sur la ligne de tarif, et le comparer au prix courant
 * demanderait une comparaison entre deux colonnes que le constructeur de
 * requêtes ne sait pas exprimer. Le tri se fait donc ici, sur une page large.
 *
 * La limite est réelle et assumée : au-delà de 100 articles au catalogue, une
 * promotion sur le 101ᵉ n'apparaîtrait pas. Le jour où le catalogue atteint
 * cette taille, c'est un filtre côté API qu'il faudra, pas une page plus
 * grande.
 */
export default async function PromotionsPage() {
  const [{ products }, categories, cart] = await Promise.all([
    listProducts({ sort: 'newest', perPage: 100 }),
    getCategoryTree(),
    getCart(),
  ]);

  const discounted = products.filter(
    (product) => product.compareAtCents !== null && product.compareAtCents > product.priceCents,
  );

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
              Promotions
            </span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">Promotions</h1>
          <p className="mt-2 max-w-xl text-ink-600">
            Les articles dont le prix a baissé. Le prix barré est celui pratiqué avant la remise.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          {discounted.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-clay-100">
                <Tag aria-hidden className="size-6 text-ink-500" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink-900">
                Aucune promotion en cours
              </h2>
              <p className="mt-1.5 max-w-sm text-ink-600">
                Les prix tiennent sans remise permanente. Quand une baisse arrive, elle apparaît
                ici.
              </p>
              <Link
                href="/nouveautes"
                className="mt-5 text-sm font-medium text-cobalt-600 hover:underline"
              >
                Voir les nouveautés
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
              {discounted.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
