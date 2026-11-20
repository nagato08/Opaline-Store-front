import { Check, TriangleAlert } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { CartView } from './cart-view';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panier' };

export default async function CartPage({ searchParams }: PageProps<'/panier'>) {
  const [cart, categories, query] = await Promise.all([
    getCart(),
    getCategoryTree(),
    searchParams,
  ]);

  /* Posé par `/panier/ajouter`, l'ajout sans JavaScript : sans ce mot, le
     client arrive sur son panier sans savoir si son geste a abouti. */
  const added = query.ajout;

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Panier</h1>

          {added === 'ok' ? (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 rounded-card bg-success-soft px-4 py-3 text-[15px] text-success"
            >
              <Check aria-hidden className="size-4 shrink-0" />
              Article ajouté à votre panier.
            </p>
          ) : added === 'echec' || added === 'invalide' ? (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-card bg-danger-soft px-4 py-3 text-[15px] text-danger"
            >
              <TriangleAlert aria-hidden className="size-4 shrink-0" />
              L’article n’a pas pu être ajouté. Il est peut-être épuisé.
            </p>
          ) : null}
          <div className="mt-8">
            <CartView initialCart={cart} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
