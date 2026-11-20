'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Heart } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
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
  compact = false,
  productName,
}: {
  productId: string;
  variantId?: string;
  /** Adresse de retour après connexion. */
  productSlug: string;
  /**
   * Forme réduite pour les vignettes : un cœur seul, posé sur la photo.
   * La fiche produit garde le bouton large avec son libellé — là, rien ne
   * presse et le mot lève l'ambiguïté du pictogramme.
   */
  compact?: boolean;
  /** Nécessaire en forme réduite, où aucun texte n'accompagne le cœur. */
  productName?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'pending' | 'done'>('idle');

  async function add(event?: React.MouseEvent) {
    /* Sur une vignette, le lien du titre recouvre toute la carte : sans cet
       arrêt, un clic sur le cœur ouvrirait aussi la fiche. */
    event?.preventDefault();
    event?.stopPropagation();
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

  if (compact) {
    return (
      <button
        type="button"
        onClick={add}
        disabled={status === 'done'}
        aria-label={
          status === 'done'
            ? `${productName ?? 'Ce produit'} est dans vos favoris`
            : `Mettre ${productName ?? 'ce produit'} de côté`
        }
        className="relative z-10 grid size-9 place-items-center rounded-full bg-surface/90 text-ink-500 backdrop-blur-sm transition-colors duration-150 hover:text-walnut-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-500 disabled:text-saffron"
      >
        <Heart aria-hidden className={cn('size-4.5', status === 'done' && 'fill-current')} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={status === 'done'}
      aria-live="polite"
      className="mt-3 inline-flex h-11 items-center gap-2 px-4 text-[15px] font-medium text-ink-700 ring-1 ring-ink-300 ring-inset transition-colors duration-150 hover:bg-ink-50 disabled:text-success disabled:ring-success/30"
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
