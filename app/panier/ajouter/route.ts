import { NextResponse, type NextRequest } from 'next/server';
import { apiBase } from '@/lib/api';

/**
 * Ajout au panier par envoi de formulaire.
 *
 * Les boutons « Ajouter au panier » fonctionnent sans JavaScript parce qu'ils
 * vivent dans un `<form method="post">` qui aboutit ici. Deux publics en
 * dépendent : un visiteur dont le script n'a pas encore chargé — ou a échoué —
 * et les agents qui achètent pour quelqu'un, qui lisent le HTML sans exécuter
 * de script et ne peuvent déclencher qu'une soumission.
 *
 * La page garde par-dessus son ajout en arrière-plan, plus agréable, et
 * n'arrive jamais jusqu'ici : `preventDefault` s'en charge tant que le script
 * tourne.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const variantId = form.get('variant_id')?.toString();
  const quantity = Number(form.get('quantity') ?? 1);
  const back = form.get('back')?.toString() || '/panier';

  /* Toute sortie de ce gestionnaire est une redirection : un POST qui répond
     par du contenu laisse le navigateur proposer de renvoyer le formulaire au
     rechargement, et la commande partirait deux fois. */
  const redirectTo = (params: Record<string, string>) => {
    const target = new URL(back, request.nextUrl.origin);
    for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
    return NextResponse.redirect(target, { status: 303 });
  };

  if (!variantId) return redirectTo({ ajout: 'invalide' });

  const response = await fetch(`${apiBase()}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      /* Le panier vit dans un cookie `httpOnly` posé par l'API : il faut le
         relayer à la main, le serveur Next n'étant pas le navigateur. */
      cookie: request.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({ variantId, quantity: Number.isFinite(quantity) ? quantity : 1 }),
  });

  const result = redirectTo({ ajout: response.ok ? 'ok' : 'echec' });

  /* Premier ajout d'un visiteur sans panier : l'API en crée un et renvoie son
     jeton. Sans ce report, le panier serait perdu à la page suivante. */
  for (const cookie of response.headers.getSetCookie()) {
    result.headers.append('set-cookie', cookie);
  }

  return result;
}
