'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/cn';

/**
 * Ajout au panier depuis la grille.
 *
 * N'apparaît que sur un produit à déclinaison unique : dès qu'il faut choisir
 * une taille ou un coloris, le bouton mènerait à un panier contenant la
 * mauvaise variante, et le client ne s'en apercevrait qu'à la livraison. Dans
 * ce cas il renvoie à la fiche, où le choix existe.
 *
 * La carte entière est déjà cliquable : ce bouton vit donc au-dessus du lien
 * qui la recouvre, et arrête la propagation pour ne pas déclencher les deux.
 *
 * Il est posé dans un vrai formulaire qui aboutit à `/panier/ajouter`. Sans
 * JavaScript — script pas encore chargé, ou agent qui achète pour quelqu'un et
 * lit le HTML sans l'exécuter — l'envoi du formulaire suffit à remplir le
 * panier. Avec, le script prend la main et évite le rechargement.
 */
export function QuickAdd({
  variantId,
  productName,
  disabled = false,
  /** Adresse de retour quand le formulaire part sans JavaScript. */
  returnTo = '/panier',
}: {
  variantId: string;
  productName: string;
  disabled?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>(
    'idle',
  );

  async function add(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (status === 'pending') return;

    setStatus('pending');
    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      setStatus('done');

      /* Le compteur de l'en-tête vient du rendu serveur : sans ce
         rafraîchissement il reste figé, et l'article semble ne pas avoir été
         ajouté. */
      router.refresh();
      setTimeout(() => setStatus('idle'), 2200);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2800);
    }
  }

  return (
    <form
      method="post"
      action="/panier/ajouter"
      onSubmit={add}
      /* La carte entière est un lien : sans cet arrêt, un clic sur le bouton
         ouvrirait aussi la fiche produit. */
      onClick={(event) => event.stopPropagation()}
      className="relative z-10"
    >
      <input type="hidden" name="variant_id" value={variantId} />
      <input type="hidden" name="quantity" value="1" />
      <input type="hidden" name="back" value={returnTo} />

      <button
        type="submit"
        disabled={disabled}
        aria-label={`Ajouter ${productName} au panier`}
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-500',
          status === 'done'
            ? 'bg-success-soft text-success'
            : status === 'error'
              ? 'bg-danger-soft text-danger'
              : 'bg-walnut-500 text-white hover:bg-walnut-600',
          disabled &&
            'cursor-not-allowed bg-ink-100 text-ink-400 hover:bg-ink-100',
        )}
      >
        {status === 'pending' ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : null}
        {status === 'done' ? <Check aria-hidden className="size-4" /> : null}
        {status === 'idle' ? (
          <ShoppingCart aria-hidden className="size-4" />
        ) : null}

        {status === 'done'
          ? 'Ajouté'
          : status === 'error'
            ? 'Réessayer'
            : disabled
              ? 'Épuisé'
              : 'Ajouter au panier'}
      </button>

      {/* L'issue est annoncée : un changement de libellé sur le bouton ne
          suffit pas, un lecteur d'écran ne le relit pas de lui-même. */}
      <span aria-live="polite" className="sr-only">
        {status === 'done'
          ? `${productName} ajouté au panier`
          : status === 'error'
            ? `${productName} n’a pas pu être ajouté`
            : ''}
      </span>
    </form>
  );
}
