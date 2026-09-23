'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const STORAGE_KEY = 'opaline.consentement.v1';

/** Un choix fait dans un onglet doit faire disparaître le bandeau des autres. */
const CHANGED = 'opaline:consentement';

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * A-t-on déjà tranché ?
 *
 * Le stockage peut être inaccessible — navigation privée, cookies bloqués — et
 * on considère alors qu'aucun choix n'a été fait : mieux vaut un bandeau qui
 * revient qu'un consentement supposé.
 */
function hasDecided(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Bandeau de consentement aux cookies.
 *
 * Trois exigences de la CNIL décident de sa forme, et chacune se voit dans le
 * code :
 *
 * 1. **Refuser doit être aussi simple qu'accepter.** Les deux boutons sont
 *    côte à côte, de même taille, au même niveau — pas un lien « paramétrer »
 *    renvoyant à un écran de cases à décocher une par une.
 * 2. **Rien ne se dépose avant le choix.** La boutique ne charge aucun
 *    traceur ; ce bandeau enregistre une décision, il n'en débloque pas un.
 * 3. **Le choix se prouve.** Il part vers `/account/consents`, qui l'horodate
 *    avec l'adresse IP et l'agent — c'est ce registre qu'une autorité
 *    demanderait.
 *
 * Le choix est aussi gardé localement pour ne pas réafficher le bandeau à
 * chaque page. `localStorage` peut être indisponible — navigation privée,
 * stockage bloqué — et chaque accès est donc protégé : mieux vaut un bandeau
 * qui revient qu'une page qui tombe.
 */
export function CookieBanner() {
  /* `useSyncExternalStore` plutôt qu'un état posé dans un effet : le stockage
     local est une source extérieure à React, et la lire dans un effet
     déclencherait un rendu supplémentaire après coup — ce que la règle
     `set-state-in-effect` interdit précisément.

     L'instantané serveur dit « déjà tranché » : le bandeau est donc absent du
     HTML servi, et apparaît à l'hydratation. C'est ce qui évite une
     divergence entre les deux rendus, le serveur n'ayant aucun moyen de
     connaître le choix. */
  const decided = useSyncExternalStore(subscribe, hasDecided, () => true);

  async function decide(isGranted: boolean) {
    try {
      window.localStorage.setItem(STORAGE_KEY, isGranted ? 'accepte' : 'refuse');
    } catch {
      /* Sans stockage, le bandeau réapparaîtra : la décision reste enregistrée
         côté serveur, ce qui est ce qui compte légalement. */
    }

    window.dispatchEvent(new Event(CHANGED));

    /* Les deux types sont envoyés séparément : le registre doit montrer un
       consentement par finalité, pas un « oui » global qu'on ne saurait pas
       détailler en cas de contrôle. */
    await Promise.allSettled([
      apiFetch('/account/consents', {
        method: 'POST',
        body: JSON.stringify({ type: 'COOKIES_ANALYTICS', isGranted, version: 'v1' }),
      }),
      apiFetch('/account/consents', {
        method: 'POST',
        body: JSON.stringify({ type: 'COOKIES_MARKETING', isGranted, version: 'v1' }),
      }),
    ]);
  }

  if (decided) return null;

  return (
    <div
      // `role="dialog"` sans `aria-modal` : le bandeau n'empêche pas de lire la
      // page, et le piéger dans un focus bloquerait la navigation à un
      // utilisateur qui veut d'abord lire la politique de confidentialité.
      role="dialog"
      aria-labelledby="consentement-titre"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="min-w-0">
          <p id="consentement-titre" className="font-medium text-ink-900">
            Cookies de mesure d’audience
          </p>
          <p className="mt-1 text-sm text-ink-600">
            Les cookies nécessaires au panier et à la connexion fonctionnent sans votre accord.
            Nous vous demandons seulement de quoi mesurer la fréquentation.{' '}
            <Link href="/mentions-legales" className="font-medium text-cobalt-600 hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="secondary" onClick={() => decide(false)}>
            Refuser
          </Button>
          <Button type="button" onClick={() => decide(true)}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
