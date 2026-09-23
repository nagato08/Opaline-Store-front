import { ShieldCheck, Star } from 'lucide-react';
import { number, shortDate } from '@/lib/format';
import type { ReviewSummary } from '@/lib/data/catalog';

/**
 * Avis publiés d'un produit.
 *
 * La fiche annonçait « 4,0 sur 5 · 1 avis » sans jamais montrer l'avis : le
 * chiffre seul demande de faire confiance, et c'est précisément ce que le
 * visiteur cherche à vérifier.
 *
 * La répartition par note vient avant les avis. Une moyenne de 4 peut cacher
 * dix notes de 4 ou cinq notes de 5 et cinq de 3, et ces deux produits ne se
 * valent pas.
 */
export function Reviews({ summary }: { summary: ReviewSummary }) {
  if (summary.total === 0) return null;

  const max = Math.max(...summary.distribution.map((row) => row.count), 1);

  return (
    <section aria-labelledby="avis" className="mt-14 border-t border-ink-200/70 pt-10">
      <h2 id="avis" className="font-display text-2xl font-semibold text-ink-900">
        Avis clients
      </h2>
      <p className="mt-1 text-ink-600">
        {number(summary.total)} avis publié{summary.total > 1 ? 's' : ''}.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <div>
          <ul className="space-y-1.5">
            {summary.distribution.map((row) => (
              <li key={row.rating} className="flex items-center gap-2.5 text-sm">
                <span className="w-12 shrink-0 text-ink-600">
                  {row.rating}
                  <span className="sr-only"> étoile{row.rating > 1 ? 's' : ''}</span>
                  <span aria-hidden> ★</span>
                </span>
                {/* Barre décorative : le compte chiffré à côté porte
                    l'information, la barre ne fait que la rendre comparable
                    d'un coup d'œil. */}
                <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-clay-100">
                  <span
                    className="block h-full rounded-full bg-saffron"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right text-ink-500">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="space-y-8">
          {summary.reviews.map((review) => (
            <li key={review.id}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={review.rating} />
                <span className="text-sm font-medium text-ink-900">{review.author}</span>
                {review.isVerifiedPurchase ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <ShieldCheck aria-hidden className="size-3.5" />
                    Achat vérifié
                  </span>
                ) : null}
                <span className="text-xs text-ink-500">{shortDate(review.createdAt)}</span>
              </div>

              {review.title ? (
                <h3 className="mt-2 font-semibold text-ink-900">{review.title}</h3>
              ) : null}
              {review.body ? (
                <p className="mt-1.5 leading-relaxed whitespace-pre-line text-ink-700">
                  {review.body}
                </p>
              ) : null}

              {review.reply ? (
                <div className="mt-3 rounded-xl bg-clay-50 p-4">
                  <p className="text-xs font-medium text-ink-500">Réponse de la boutique</p>
                  <p className="mt-1 leading-relaxed whitespace-pre-line text-ink-700">
                    {review.reply}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** La note est doublée d'un texte : cinq pictogrammes identiques ne disent rien. */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className="sr-only">{rating} sur 5</span>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden
          className={value <= rating ? 'size-4 fill-saffron text-saffron' : 'size-4 text-ink-300'}
        />
      ))}
    </span>
  );
}
