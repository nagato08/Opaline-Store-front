import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { TrackingForm } from './tracking-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Suivre ma commande' };

export default async function OrderTrackingPage({ searchParams }: PageProps<'/suivi-commande'>) {
  const [categories, cart, query] = await Promise.all([getCategoryTree(), getCart(), searchParams]);
  const initialNumber = typeof query.numero === 'string' ? query.numero : '';

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Suivre ma commande</h1>
          <p className="mt-2 text-ink-600">
            Le numéro de commande et le courriel utilisé à l’achat suffisent — aucun compte
            n’est nécessaire.
          </p>

          <div className="mt-8">
            <TrackingForm initialNumber={initialNumber} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
