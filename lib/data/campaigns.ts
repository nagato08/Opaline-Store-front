import { apiBase } from '@/lib/api';

/**
 * Campagnes d'affichage — bandeaux, fenêtres, barres programmées.
 *
 * Le partage des rôles est posé côté API et il faut s'y tenir : **le serveur
 * décide si** une campagne est éligible — planning, récurrence avec fuseau,
 * ciblage, plafond par visiteur — et **le navigateur décide quand** l'afficher,
 * en appliquant `displayRules`. L'inverse exposerait toute la programmation
 * marketing dans le bundle.
 */

export type CampaignType =
  | 'BANNER'
  | 'POPUP'
  | 'TOP_BAR'
  | 'INTERSTITIAL'
  | 'IN_PAGE_NOTICE'
  | 'COUNTDOWN';

export type DisplayRules = {
  trigger?: 'DELAY' | 'SCROLL' | 'EXIT_INTENT' | 'IMMEDIATE';
  delayMs?: number;
  scrollPercent?: number;
  dismissible?: boolean;
  maxPerVisitor?: number;
  cooldownHours?: number;
};

export type Campaign = {
  id: string;
  code: string;
  type: CampaignType;
  slot: string;
  priority: number;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  displayRules: DisplayRules | null;
  promotionCode: string | null;
  endsAt: string | null;
};

const VISITOR_KEY = 'opaline.visiteur';

/**
 * Identifiant de visiteur anonyme et stable.
 *
 * C'est **lui** qui plafonne les répétitions côté serveur : sans en-tête
 * `X-Visitor-Id`, `maxPerVisitor` et `cooldownHours` ne s'appliquent à
 * personne, et la même fenêtre revient à chaque page.
 *
 * Aucune donnée personnelle : un identifiant tiré au hasard, gardé dans le
 * navigateur. S'il est indisponible — navigation privée, stockage bloqué — on
 * repart sans, et le visiteur verra simplement les campagnes plus souvent.
 */
export function visitorId(): string | null {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const fresh = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

/**
 * Campagnes éligibles pour la page courante.
 *
 * Appelée depuis le navigateur, jamais au rendu serveur : le ciblage dépend de
 * l'appareil et de l'identifiant de visiteur, dont le serveur ne dispose pas.
 */
export async function listCampaigns(path: string, cartTotalCents = 0): Promise<Campaign[]> {
  const visitor = visitorId();
  const query = new URLSearchParams({ path });
  if (cartTotalCents > 0) query.set('cartTotalCents', String(cartTotalCents));

  try {
    const response = await fetch(`${apiBase()}/content/campaigns?${query}`, {
      credentials: 'include',
      headers: visitor ? { 'X-Visitor-Id': visitor } : undefined,
      cache: 'no-store',
    });

    if (!response.ok) return [];
    return (await response.json()) as Campaign[];
  } catch {
    /* Une campagne qui ne se charge pas n'est pas une panne : la boutique
       fonctionne sans, et une erreur ici ne doit rien interrompre. */
    return [];
  }
}

/**
 * Remonte une impression, un clic ou une fermeture.
 *
 * Sans ces appels, le plafonnement par visiteur ne fonctionne pas — le serveur
 * n'a aucun moyen de savoir qu'une campagne a déjà été vue — et les
 * statistiques du back-office restent à zéro.
 *
 * `keepalive` : une fermeture suivie d'une navigation immédiate perdrait
 * autrement la requête.
 */
export function trackCampaign(id: string, type: 'IMPRESSION' | 'CLICK' | 'DISMISS'): void {
  const visitor = visitorId();

  void fetch(`${apiBase()}/content/campaigns/${encodeURIComponent(id)}/track`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(visitor ? { 'X-Visitor-Id': visitor } : {}),
    },
    body: JSON.stringify({ type }),
  }).catch(() => {
    /* Le suivi ne doit jamais faire échouer l'affichage. */
  });
}
