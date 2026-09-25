import { Suspense } from 'react';
import { CallbackHandler } from './callback-handler';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Connexion en cours…', robots: { index: false } };

/**
 * Retour de Google.
 *
 * L'API a déjà posé les cookies de session avant de renvoyer ici : cette page
 * n'authentifie rien, elle rattache le panier visiteur au compte et remet le
 * client là où il était parti.
 *
 * `Suspense` est imposé par `useSearchParams` dans le composant client ; sans
 * lui, le rendu statique de la page échouerait à la compilation.
 */
export default function AuthCallbackPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <Suspense fallback={<p className="text-ink-600">Connexion en cours…</p>}>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
