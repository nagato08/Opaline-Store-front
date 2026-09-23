import { getStoreSettings } from '@/lib/data/settings';
import { HeaderClient } from './header-client';
import type { Category } from '@/lib/data/catalog';

/**
 * En-tête de la boutique.
 *
 * Enveloppe serveur autour du composant interactif : elle lit l'enseigne dans
 * les réglages de l'API, ce qu'un composant client ne peut pas faire. Les
 * dix-neuf pages qui affichent l'en-tête n'ont ainsi rien à transmettre —
 * ajouter la propriété à chaque appel aurait garanti qu'un oubli laisse un nom
 * en dur quelque part.
 */
export async function Header({
  categories,
  cartCount = 0,
}: {
  categories: Category[];
  cartCount?: number;
}) {
  const store = await getStoreSettings();

  return <HeaderClient categories={categories} cartCount={cartCount} storeName={store.name} />;
}
