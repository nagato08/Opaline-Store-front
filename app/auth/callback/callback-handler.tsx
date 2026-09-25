'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { RETURN_KEY } from '@/components/auth/google-button';

/**
 * Rattache le panier visiteur au compte, puis s'efface.
 *
 * Sans `POST /cart/merge`, le client qui remplit son panier sans être connecté
 * puis passe par Google au moment de payer retrouve le panier de son compte —
 * souvent vide — et croit avoir tout perdu. La fusion est la première chose à
 * faire, avant même de quitter cette page.
 *
 * Elle est tolérante à l'échec : un panier qui ne fusionne pas ne doit pas
 * bloquer une connexion réussie. Le client est connecté dans tous les cas, et
 * c'est l'essentiel de ce qu'il attendait.
 */
export function CallbackHandler() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      try {
        await apiFetch('/cart/merge', { method: 'POST' });
      } catch {
        /* Pas de panier visiteur à fusionner, ou fusion refusée : sans
           conséquence sur la session, qui est déjà ouverte. */
      }

      if (cancelled) return;

      let destination = '/compte';
      try {
        destination = window.sessionStorage.getItem(RETURN_KEY) || '/compte';
        window.sessionStorage.removeItem(RETURN_KEY);
      } catch {
        /* Stockage indisponible : retour à la page du compte. */
      }

      /* `replace` et non `push` : cette page n'a rien à faire dans
         l'historique, un retour arrière la rejouerait sans raison. */
      router.replace(destination);
      router.refresh();
    }

    void finish();

    /* Filet de sécurité : si la redirection n'aboutit pas — route inconnue
       mise de côté par un onglet rouvert, par exemple — le visiteur doit
       pouvoir repartir à la main plutôt que de rester sur un écran d'attente
       perpétuel. */
    const timer = setTimeout(() => {
      if (!cancelled) setFailed(true);
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);

  if (failed) {
    return (
      <div className="text-center">
        <p className="text-ink-900">Vous êtes connecté.</p>
        <Link
          href="/compte"
          className="mt-2 inline-block font-medium text-cobalt-600 hover:underline"
        >
          Aller à mon compte
        </Link>
      </div>
    );
  }

  return (
    <p role="status" className="flex items-center gap-3 text-ink-600">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      Connexion en cours…
    </p>
  );
}
