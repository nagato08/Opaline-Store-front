import Link from 'next/link';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Retours et remboursements' };

export default async function ReturnsPolicyPage() {
  const [categories, cart] = await Promise.all([getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Retours et remboursements</h1>

          <div className="mt-8 flex items-start gap-3 rounded-card border border-ink-200/70 p-6">
            <RotateCcw aria-hidden className="mt-0.5 size-6 shrink-0 text-cobalt-600" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                14 jours pour changer d’avis
              </h2>
              <p className="mt-1.5 text-[15px] text-ink-700">
                À compter de la réception, sans justification à fournir. Le produit doit être
                retourné dans l’état où il a été reçu.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-card border border-ink-200/70 p-6">
            <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-cobalt-600" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Produit défectueux ou non conforme
              </h2>
              <p className="mt-1.5 text-[15px] text-ink-700">
                Remboursement ou échange pris en charge, en dehors du délai de rétractation.
              </p>
            </div>
          </div>

          <p className="mt-8 text-ink-600">
            Certains articles ne peuvent pas être repris pour des raisons d’hygiène ou de
            péremption — c’est le cas de l’alimentaire déjà ouvert.
          </p>

          <div className="mt-8">
            <Link href="/suivi-commande" className="font-medium text-cobalt-600 hover:underline">
              Retrouvez votre commande pour démarrer un retour →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
