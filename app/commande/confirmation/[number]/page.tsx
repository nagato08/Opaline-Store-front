import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ButtonLink } from '@/components/ui/button';
import { OrderSummary } from '@/components/order/order-summary';
import { shortDate } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { trackOrderByToken } from '@/lib/data/orders';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Commande confirmée' };

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: PageProps<'/commande/confirmation/[number]'>) {
  const { number: orderNumber } = await params;
  const query = await searchParams;
  const token = typeof query.token === 'string' ? query.token : undefined;

  const [order, categories] = await Promise.all([
    token ? trackOrderByToken(token) : Promise.resolve(null),
    getCategoryTree(),
  ]);

  if (!order || order.number !== decodeURIComponent(orderNumber)) notFound();

  return (
    <>
      <Header categories={categories} cartCount={0} />

      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 text-center lg:px-8">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft">
            <CheckCircle2 aria-hidden className="size-8 text-success" />
          </span>

          <h1 className="mt-5 text-3xl font-bold text-ink-900 sm:text-4xl">
            Commande confirmée
          </h1>
          <p className="mt-2 text-ink-600">
            Numéro{' '}
            <span className="font-mono font-medium text-ink-900" translate="no">
              {order.number}
            </span>{' '}
            · reçue le {shortDate(order.createdAt)}
          </p>
          <p className="mt-1 text-ink-600">
            Un courriel de confirmation a été envoyé à {order.email}.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16 lg:px-8">
          <OrderSummary order={order} />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/suivi-commande?numero=${encodeURIComponent(order.number)}`} variant="secondary" size="lg">
              Suivre ma commande
            </ButtonLink>
            <ButtonLink href="/" size="lg">
              Continuer mes achats
            </ButtonLink>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500">
            Pas de compte ?{' '}
            <Link href="/compte/inscription" className="font-medium text-cobalt-600 hover:underline">
              Créez-en un
            </Link>{' '}
            pour retrouver cette commande plus tard.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
