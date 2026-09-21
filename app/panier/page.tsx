import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { CartView } from './cart-view';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panier' };

export default async function CartPage() {
  const [cart, categories] = await Promise.all([getCart(), getCategoryTree()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Panier</h1>
          <div className="mt-8">
            <CartView initialCart={cart} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
