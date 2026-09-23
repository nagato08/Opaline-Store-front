import { apiFetch } from '@/lib/api';

/**
 * Réglages publics de la boutique.
 *
 * L'enseigne du client est un réglage, jamais une constante : « Comptoir » est
 * le nom du logiciel, pas celui du commerce. Les conventions du projet
 * l'interdisent explicitement, et le code l'écrivait pourtant en dur à trois
 * endroits.
 */
export type StoreSettings = {
  name: string;
  email: string | null;
  defaultCurrency: string;
};

/** Valeurs de repli : l'en-tête et le pied de page ne doivent jamais tomber. */
const FALLBACK: StoreSettings = { name: 'Boutique', email: null, defaultCurrency: 'EUR' };

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const settings = await apiFetch<Record<string, unknown>>('/settings');

    return {
      name: typeof settings['store.name'] === 'string' ? settings['store.name'] : FALLBACK.name,
      email: typeof settings['store.email'] === 'string' ? settings['store.email'] : null,
      defaultCurrency:
        typeof settings['store.defaultCurrency'] === 'string'
          ? settings['store.defaultCurrency']
          : FALLBACK.defaultCurrency,
    };
  } catch {
    /* Une API momentanément indisponible ne doit pas faire disparaître la
       navigation : mieux vaut un nom générique qu'une page blanche. */
    return FALLBACK;
  }
}
