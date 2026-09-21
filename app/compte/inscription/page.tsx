import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { RegisterForm } from './register-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Créer un compte' };

export default async function RegisterPage() {
  const [categories, cart] = await Promise.all([getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-md px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900">Créer un compte</h1>
          <p className="mt-2 text-ink-600">
            Déjà client ?{' '}
            <Link href="/compte/connexion" className="font-medium text-cobalt-600 hover:underline">
              Connectez-vous
            </Link>
          </p>

          <div className="mt-8">
            <RegisterForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
