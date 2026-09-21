import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Connexion' };

export default async function LoginPage() {
  const [categories, cart] = await Promise.all([getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-md px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900">Connexion</h1>
          <p className="mt-2 text-ink-600">
            Pas de compte ?{' '}
            <Link href="/compte/inscription" className="font-medium text-cobalt-600 hover:underline">
              Inscrivez-vous
            </Link>
          </p>

          <div className="mt-8">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
