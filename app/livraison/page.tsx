import { Snowflake, Truck } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Livraison' };

const ZONES = [
  {
    title: 'France métropolitaine',
    points: [
      'Point relais ou domicile 48 h pour les colis standards.',
      'Chaîne du froid respectée pour les commandes réfrigérées.',
      'Livraison sur rendez-vous pour le mobilier volumineux.',
      'Offerte dès 60 € d’achat.',
    ],
  },
  {
    title: 'Canada',
    points: [
      'Livraison disponible pour l’électronique et l’épicerie.',
      'Taxes (TPS/TVQ) ajoutées au paiement, jamais incluses dans le prix affiché.',
      'Le mobilier hors gabarit n’est pas encore livrable au Canada : aucun transporteur ne couvre ce format pour l’instant.',
    ],
  },
];

export default async function ShippingPolicyPage() {
  const [categories, cart] = await Promise.all([getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Livraison</h1>
          <p className="mt-3 text-ink-600">
            Les frais et délais exacts se calculent à l’adresse indiquée, au moment de la
            commande — ce qui suit décrit les règles générales.
          </p>

          <div className="mt-10 space-y-8">
            {ZONES.map((zone) => (
              <div key={zone.title} className="rounded-card border border-ink-200/70 p-6">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink-900">
                  <Truck aria-hidden className="size-5 text-cobalt-600" />
                  {zone.title}
                </h2>
                <ul className="mt-3 space-y-2 text-[15px] text-ink-700">
                  {zone.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-card bg-clay-50 p-5 text-sm text-ink-700">
            <Snowflake aria-hidden className="mt-0.5 size-5 shrink-0 text-cobalt-600" />
            <p>
              Un produit nécessitant la chaîne du froid ne se combine qu’avec les modes de
              livraison compatibles : ils sont seuls proposés à la sélection, plutôt que
              d’afficher une option qui rendrait la commande impropre à la consommation.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
