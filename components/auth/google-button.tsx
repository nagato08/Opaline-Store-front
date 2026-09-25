'use client';

import { apiBase } from '@/lib/api';

/** Mémorise la page à rejoindre après le détour par Google. */
export const RETURN_KEY = 'opaline.connexion.suite';

/**
 * Connexion et inscription par Google.
 *
 * Un lien, pas un appel : OAuth exige une navigation complète du navigateur
 * vers Google, puis un retour vers l'API qui pose les cookies de session. Un
 * `fetch` ne peut rien y faire — il suivrait la redirection sans que la barre
 * d'adresse change, et Google refuse d'afficher son écran de consentement dans
 * ces conditions.
 *
 * L'API redirige ensuite vers `/auth/callback`, sans nous dire d'où l'on
 * venait : la destination est donc mise de côté avant le départ, et relue au
 * retour. Le stockage de session suffit — il meurt avec l'onglet, ce qui est
 * exactement la durée de vie utile de cette information.
 */
export function GoogleButton({ label, next }: { label: string; next?: string | null }) {
  function remember() {
    try {
      window.sessionStorage.setItem(RETURN_KEY, next || '/compte');
    } catch {
      /* Navigation privée ou stockage bloqué : le retour se fera sur la page
         du compte, ce qui reste un endroit sensé. */
    }
  }

  return (
    <a
      href={`${apiBase()}/auth/google`}
      onClick={remember}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-control border border-ink-300 bg-surface text-[15px] font-medium text-ink-900 transition-colors duration-150 hover:border-ink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-500"
    >
      <GoogleMark />
      {label}
    </a>
  );
}

/**
 * Logo Google.
 *
 * Reproduit tel quel, aux couleurs officielles : les règles d'identité de
 * Google imposent le logo d'origine sur un bouton de connexion, et un logo
 * redessiné ou monochrome n'est pas conforme. C'est la seule exception à la
 * règle « aucune couleur en dur » de ce projet — ces valeurs n'appartiennent
 * pas à la charte de la boutique.
 */
function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Séparateur entre les deux façons d'entrer.
 *
 * Le trait est décoratif, le mot ne l'est pas : sans lui, deux blocs de
 * boutons se lisent comme une seule liste d'actions équivalentes.
 */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-4">
      <span aria-hidden className="h-px flex-1 bg-ink-200" />
      <span className="text-sm text-ink-500">ou</span>
      <span aria-hidden className="h-px flex-1 bg-ink-200" />
    </div>
  );
}
