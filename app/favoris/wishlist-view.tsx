'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, X } from 'lucide-react';
import { money } from '@/lib/format';
import { removeFromWishlist, type WishlistItem } from '@/lib/data/wishlist';

/**
 * Liste d'envies du client.
 *
 * Le retrait se fait sur place, sans confirmation : rien n'est détruit, le
 * produit reste au catalogue, et un retour en arrière coûte un clic depuis la
 * fiche. Demander confirmation pour ça agacerait plus que ça ne protégerait.
 *
 * La ligne disparaît **avant** la réponse du serveur. En cas d'échec elle
 * revient, avec un message : attendre une seconde pour voir une vignette
 * s'effacer donne l'impression d'une interface qui rame.
 */
export function WishlistView({ items }: { items: WishlistItem[] }) {
  const [list, setList] = useState(items);
  const [error, setError] = useState('');

  async function remove(item: WishlistItem) {
    setError('');
    setList((current) => current.filter((row) => row.id !== item.id));

    try {
      await removeFromWishlist(item.id);
    } catch {
      setList(items);
      setError(`« ${item.name} » n’a pas pu être retiré. Réessayez.`);
    }
  }

  if (list.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-ink-900">Aucun favori pour l’instant</p>
        <p className="mt-1.5 text-ink-600">
          Le cœur sur une fiche produit met l’article de côté, sans l’acheter.
        </p>
        <Link href="/" className="mt-5 inline-block font-medium text-cobalt-600 hover:underline">
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-ink-200/70">
        {list.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-5">
            <Link href={`/produits/${item.slug}`} className="shrink-0">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="size-20 rounded-xl object-cover"
                />
              ) : (
                <span className="grid size-20 place-items-center rounded-xl bg-clay-100">
                  <ImageOff aria-hidden className="size-5 text-ink-400" />
                </span>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/produits/${item.slug}`}
                className="font-medium text-ink-900 hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-ink-700">{money(item.priceCents, item.currencyCode)}</p>
              {!item.isAvailable ? (
                <p className="mt-0.5 text-sm text-danger">Épuisé pour le moment</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => remove(item)}
              aria-label={`Retirer ${item.name} des favoris`}
              className="grid size-10 shrink-0 place-items-center rounded-full text-ink-500 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900"
            >
              <X aria-hidden className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
