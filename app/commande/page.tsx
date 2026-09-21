import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart, getPaymentMethods } from '@/lib/data/cart';
import { CheckoutWizard } from './checkout-wizard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commande' };

export default async function CheckoutPage() {
  const [cart, categories, paymentMethods] = await Promise.all([
    getCart(),
    getCategoryTree(),
    getPaymentMethods(),
  ]);

  // Un panier vide n'a rien à commander : la seule chose à y faire est d'y
  // retourner remplir, pas d'afficher un tunnel de commande vide.
  if (cart.lines.length === 0) redirect('/panier');

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Commande</h1>
          <div className="mt-8">
            <CheckoutWizard initialCart={cart} initialPaymentMethods={paymentMethods} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
