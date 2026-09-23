import { apiFetch, ApiError } from '@/lib/api';

/**
 * Liste d'envies.
 *
 * Réservée aux clients connectés : l'API la rattache à un compte, sans
 * équivalent anonyme. Un visiteur sans compte est donc invité à se connecter
 * plutôt que de voir un bouton qui échouerait.
 */
export type WishlistItem = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currencyCode: string;
  isAvailable: boolean;
};

export type Wishlist = { id: string; items: WishlistItem[] };

/**
 * Rend `null` quand personne n'est connecté, plutôt qu'une liste vide : les
 * deux situations n'appellent pas le même écran — l'une invite à se connecter,
 * l'autre à parcourir le catalogue.
 */
export async function getWishlist(): Promise<Wishlist | null> {
  try {
    return await apiFetch<Wishlist>('/wishlist');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function addToWishlist(productId: string, variantId?: string): Promise<void> {
  await apiFetch('/wishlist/items', {
    method: 'POST',
    body: JSON.stringify({ productId, ...(variantId ? { variantId } : {}) }),
  });
}

export async function removeFromWishlist(itemId: string): Promise<void> {
  await apiFetch(`/wishlist/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
}
