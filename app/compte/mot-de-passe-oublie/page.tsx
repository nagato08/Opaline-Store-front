import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { ForgotForm } from './forgot-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mot de passe oublié' };

/**
 * Le formulaire de connexion proposait « Oublié ? » depuis le premier jour,
 * vers une adresse qui n'existait pas : un client ayant perdu son mot de passe
 * n'avait aucun recours.
 */
export default async function ForgotPasswordPage() {
  const [categories, cart] = await Promise.all([getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-md px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900">Mot de passe oublié</h1>
          <p className="mt-2 text-ink-600">
            Indiquez l’adresse de votre compte : nous vous envoyons un lien pour en choisir un
            nouveau.
          </p>

          <div className="mt-8">
            <ForgotForm />
          </div>

          <p className="mt-6 text-sm text-ink-500">
            <Link href="/compte/connexion" className="font-medium text-cobalt-600 hover:underline">
              Revenir à la connexion
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
