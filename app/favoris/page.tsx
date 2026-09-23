import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { getWishlist } from '@/lib/data/wishlist';
import { WishlistView } from './wishlist-view';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mes favoris' };

/**
 * L'icône en forme de cœur était dans l'en-tête de chaque page, avec son
 * `aria-label`, sans être un lien : elle ne menait nulle part.
 */
export default async function WishlistPage() {
  const [wishlist, categories, cart] = await Promise.all([
    getWishlist(),
    getCategoryTree(),
    getCart(),
  ]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900">Mes favoris</h1>

          {wishlist === null ? (
            /* Pas de redirection vers la connexion : le visiteur a cliqué sur
               un cœur, pas demandé à se connecter. On explique, et on laisse
               le choix. */
            <div className="mt-8 rounded-xl bg-clay-50 p-6">
              <p className="text-[15px] text-ink-700">
                Les favoris sont rattachés à votre compte : ils vous suivent d’un appareil à
                l’autre, et survivent à la fermeture du navigateur.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/compte/connexion?suite=/favoris"
                  className="inline-flex h-11 items-center rounded-xl bg-cobalt-500 px-5 font-medium text-white transition-colors duration-150 hover:bg-cobalt-600"
                >
                  Se connecter
                </Link>
                <Link
                  href="/compte/inscription"
                  className="inline-flex h-11 items-center rounded-xl px-5 font-medium text-ink-900 ring-1 ring-ink-300 ring-inset transition-colors duration-150 hover:bg-ink-50"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <WishlistView items={wishlist.items} />
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
