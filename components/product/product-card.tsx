import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { discountRate, money, unitPrice } from '@/lib/format';

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  /** Nul tant qu'aucune photo n'est encore chargée sur ce produit. */
  imageUrl: string | null;
  imageAlt: string;
  priceCents: number;
  compareAtCents: number | null;
  currencyCode: string;
  isAvailable: boolean;
  /** Renseigné sur les denrées : impose l'affichage du prix au kilo ou au litre. */
  measure?: { quantity: number; unit: string };
  /**
   * Éco-participation. Elle n'est plus affichée sur la carte : une quatrième
   * ligne sous chaque prix noyait la grille pour une mention dont l'obligation
   * porte sur la page du produit, où elle figure toujours.
   */
  ecoTaxCents?: number;
  ratingAvg?: number;
  ratingCount?: number;
};

/**
 * Carte produit.
 *
 * L'image occupe les quatre cinquièmes de la carte : sur ce catalogue, c'est
 * elle qui déclenche le clic. Le texte se contente de confirmer.
 *
 * La carte entière est cliquable via un lien qui recouvre la zone, mais le
 * lien lui-même n'entoure pas tout le contenu : garder un `<a>` court permet
 * aux lecteurs d'écran d'annoncer un libellé utile plutôt que de réciter le
 * prix, la marque et la note.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const hasDiscount =
    product.compareAtCents !== null && product.compareAtCents > product.priceCents;

  return (
    <article className="group relative flex flex-col">
      <div className="ratio-product relative overflow-hidden rounded-card bg-clay-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            // Dimensions déclarées par `fill` + conteneur au ratio fixe : la
            // grille ne saute pas pendant le chargement.
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            priority={priority}
            className={cn(
              'object-cover transition-transform duration-300',
              // Un léger rapprochement au survol, jamais de déplacement : la
              // carte ne doit pas bouger sous le curseur.
              'group-hover:scale-[1.03]',
              !product.isAvailable && 'opacity-60',
            )}
          />
        ) : (
          <div aria-hidden className="grid size-full place-items-center">
            <ImageOff className="size-8 text-ink-400" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {hasDiscount ? (
            <span className="rounded-full bg-saffron px-2.5 py-1 text-xs font-semibold text-white">
              {discountRate(product.priceCents, product.compareAtCents as number)}
            </span>
          ) : null}
          {!product.isAvailable ? (
            <span className="rounded-full bg-ink-900/85 px-2.5 py-1 text-xs font-medium text-white">
              Épuisé
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3.5 flex flex-1 flex-col">
        {product.brand ? (
          <p className="text-xs tracking-wide text-ink-500 uppercase">{product.brand}</p>
        ) : null}

        <h3 className="mt-1 font-sans text-[15px] leading-snug font-medium text-ink-900">
          <Link href={`/produits/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>

        {product.ratingCount ? (
          <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-500">
            <Stars value={product.ratingAvg ?? 0} />
            <span className="sr-only">
              Note de {product.ratingAvg?.toFixed(1)} sur 5, {product.ratingCount} avis
            </span>
            <span aria-hidden>({product.ratingCount})</span>
          </p>
        ) : null}

        <div className="mt-auto pt-2.5">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              data-price
              className={cn(
                'text-lg font-semibold',
                hasDiscount ? 'text-saffron' : 'text-ink-900',
              )}
            >
              {money(product.priceCents, product.currencyCode)}
            </span>
            {hasDiscount ? (
              <span data-price className="text-sm text-ink-500 line-through">
                {money(product.compareAtCents as number, product.currencyCode)}
              </span>
            ) : null}
          </p>

          {/* Prix à l'unité de mesure : obligatoire en UE sur les denrées
              préemballées, et de toute façon le seul moyen de comparer deux
              conditionnements différents. */}
          {product.measure ? (
            <p data-price className="mt-0.5 text-sm text-ink-500">
              {unitPrice(
                product.priceCents,
                product.measure.quantity,
                product.measure.unit,
                product.currencyCode,
              )}
            </p>
          ) : null}

        </div>
      </div>
    </article>
  );
}

/**
 * Note en étoiles. Décorative : le texte équivalent est en `sr-only`.
 *
 * Deux rangées superposées, la dorée rognée à la largeur de la note, plutôt
 * qu'un dégradé SVG par étoile. Le dégradé demandait un `id`, et cet `id`
 * était le même sur toutes les cartes d'une grille : un document HTML ne
 * garde que la première définition, si bien que chaque produit affichait la
 * note du premier de la liste. La largeur, elle, ne collisionne avec rien, et
 * les couleurs redeviennent des jetons.
 */
function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, value));

  return (
    <span aria-hidden className="relative inline-flex">
      <span className="flex items-center gap-px text-ink-300">
        {[1, 2, 3, 4, 5].map((step) => (
          <Star key={step} className="size-3.5 fill-current" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex items-center gap-px overflow-hidden text-saffron"
        style={{ width: `${(filled / 5) * 100}%` }}
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <Star key={step} className="size-3.5 shrink-0 fill-current" />
        ))}
      </span>
    </span>
  );
}
