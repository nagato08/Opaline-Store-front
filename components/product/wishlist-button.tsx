'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Heart } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { addToWishlist } from '@/lib/data/wishlist';

/**
 * Mise de côté d'un produit.
 *
 * La liste est rattachée à un compte côté API, sans équivalent anonyme. Plutôt
 * que de masquer le bouton aux visiteurs — ce qui cache une fonctionnalité à
 * ceux qui pourraient en vouloir — il est toujours visible et redirige vers la
 * connexion, en gardant l'adresse de retour. C'est aussi l'occasion la plus
 * naturelle de proposer un compte.
 *
 * Il n'affiche pas si le produit y est déjà : le savoir demanderait de charger
 * la liste sur chaque fiche, pour une information que la page favoris donne
 * mieux. Ajouter deux fois est sans effet, l'API déduplique.
 */
export function WishlistButton({
  productId,
  variantId,
  productSlug,
}: {
  productId: string;
  variantId?: string;
  /** Adresse de retour après connexion. */
  productSlug: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'pending' | 'done'>('idle');

  async function add() {
    setStatus('pending');

    try {
      await addToWishlist(productId, variantId);
      setStatus('done');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(`/compte/connexion?suite=/produits/${encodeURIComponent(productSlug)}`);
        return;
      }
      setStatus('idle');
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={status === 'done'}
      aria-live="polite"
      className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-medium text-ink-700 ring-1 ring-ink-300 ring-inset transition-colors duration-150 hover:bg-ink-50 disabled:text-success disabled:ring-success/30"
    >
      {status === 'done' ? (
        <>
          <Check aria-hidden className="size-4" />
          Dans vos favoris
        </>
      ) : (
        <>
          <Heart aria-hidden className="size-4" />
          {status === 'pending' ? 'Ajout…' : 'Mettre de côté'}
        </>
      )}
    </button>
  );
}
