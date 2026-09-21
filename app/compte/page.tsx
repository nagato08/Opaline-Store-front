import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { LogoutButton } from '@/components/account/logout-button';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/components/order/order-summary';
import { money, shortDate } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { getMe, listMyOrders } from '@/lib/data/account';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon compte' };

export default async function AccountPage() {
  const me = await getMe();
  if (!me) redirect('/compte/connexion?suite=/compte');

  const [categories, cart, { orders }] = await Promise.all([getCategoryTree(), getCart(), listMyOrders()]);
  const recentOrders = orders.slice(0, 3);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-ink-900">
                Bonjour {me.firstName ?? me.email}
              </h1>
              <p className="mt-1 text-ink-600">{me.email}</p>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-8">
            <AccountNav current="/compte" />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Commandes récentes
              </h2>
              {orders.length > 0 ? (
                <Link href="/compte/commandes" className="inline-flex items-center gap-1.5 text-sm font-medium text-cobalt-600 hover:underline">
                  Tout voir
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              ) : null}
            </div>

            {recentOrders.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-card border border-ink-200/70 px-6 py-14 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-clay-100">
                  <Package aria-hidden className="size-5 text-ink-500" />
                </span>
                <p className="mt-3 text-ink-600">Aucune commande pour l’instant.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-ink-200/70 rounded-card border border-ink-200/70">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/compte/commandes/${order.number}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-ink-50"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium text-ink-900" translate="no">
                          {order.number}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-500">{shortDate(order.createdAt)}</p>
                      </div>
                      <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                      <span data-price className="shrink-0 font-medium text-ink-900">
                        {money(order.totalCents, order.currencyCode)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
