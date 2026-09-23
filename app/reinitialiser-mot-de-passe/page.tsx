import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { ResetForm } from './reset-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouveau mot de passe' };

/**
 * Cible du lien envoyé par courriel.
 *
 * L'adresse est imposée par l'API — `auth.service.ts` compose
 * `${storefrontUrl}/reinitialiser-mot-de-passe?token=…` — et aucune page n'y
 * répondait : le courriel de réinitialisation menait droit à un 404.
 *
 * La route vit à la racine, pas sous `/compte` : elle s'adresse à quelqu'un
 * qui n'est précisément pas connecté.
 */
export default async function ResetPasswordPage() {
  const [categories, cart] = await Promise.all([getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-md px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900">Nouveau mot de passe</h1>
          <p className="mt-2 text-ink-600">
            Choisissez le mot de passe qui protégera votre compte.
          </p>

          <div className="mt-8">
            <Suspense>
              <ResetForm />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
