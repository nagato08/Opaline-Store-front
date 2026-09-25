import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, RotateCcw, ShieldCheck, Snowflake, Star, Truck } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { countryName, number } from '@/lib/format';
import { getCategoryTree, getProductBySlug, listReviews } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { Reviews } from '@/components/product/reviews';
import { PurchasePanel } from './purchase-panel';
import { WishlistButton } from '@/components/product/wishlist-button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/produits/[slug]'>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.seo.title ?? 'Produit introuvable',
    description: product?.seo.description || undefined,
  };
}

export default async function ProductPage({ params }: PageProps<'/produits/[slug]'>) {
  const { slug } = await params;
  const [product, categories, cart] = await Promise.all([getProductBySlug(slug), getCategoryTree(), getCart()]);

  if (!product) notFound();

  /* Les avis se chargent après le produit, pas en parallèle : leur route est
     indexée par l'identifiant du produit, qu'on n'a pas avant de l'avoir lu. */
  const reviews = await listReviews(product.id);

  const primaryCategory = product.categories.find((category) => category.isPrimary) ?? product.categories[0];
  const food = product.compliance.food;

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
          <nav aria-label="Fil d’Ariane" className="text-sm text-ink-500">
            <Link href="/" className="hover:text-ink-800 hover:underline">
              Accueil
            </Link>
            {primaryCategory ? (
              <>
                <span aria-hidden className="mx-1.5">/</span>
                <Link href={`/rayons/${primaryCategory.slug}`} className="hover:text-ink-800 hover:underline">
                  {primaryCategory.name}
                </Link>
              </>
            ) : null}
            <span aria-hidden className="mx-1.5">/</span>
            <span className="text-ink-700" aria-current="page">{product.name}</span>
          </nav>
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 pb-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* --- Galerie ------------------------------------------------- */}
            {/* Collante à partir du grand écran : la colonne d'achat est plus
                courte que la photo, et la laisser défiler seule ouvrait un
                vide de quatre cents pixels à droite. */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="ratio-product relative overflow-hidden rounded-card bg-clay-100">
                {product.media[0]?.variants ? (
                  <Image
                    src={product.media[0].variants.zoom}
                    alt={product.media[0].alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div aria-hidden className="grid size-full place-items-center">
                    <ImageOff className="size-10 text-ink-400" />
                  </div>
                )}
              </div>

              {product.media.length > 1 ? (
                <div className="mt-3 grid grid-cols-5 gap-3">
                  {product.media.slice(1, 6).map((media) => (
                    <div
                      key={media.id}
                      className="relative aspect-square overflow-hidden rounded-control bg-clay-100"
                    >
                      {media.variants ? (
                        <Image src={media.variants.thumbnail} alt={media.alt} fill sizes="120px" className="object-cover" />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* --- Informations et achat ------------------------------------ */}
            <div>
              {product.brand ? (
                /* La marque mène à la recherche filtrée : c'est le geste
                   attendu quand on la lit, et la facette existait déjà côté
                   API sans que rien ne l'utilise. */
                <Link
                  href={`/recherche?marque=${encodeURIComponent(product.brand.id)}`}
                  className="text-sm tracking-wide text-ink-500 uppercase hover:text-ink-800 hover:underline"
                >
                  {product.brand.name}
                </Link>
              ) : null}

              <h1 className="mt-1 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
                {product.name}
              </h1>

              {product.rating.count > 0 ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
                  <Star aria-hidden className="size-4 fill-current text-saffron" />
                  <span className="font-semibold text-ink-900">{product.rating.average.toFixed(1)}</span>
                  sur 5 · {number(product.rating.count)} avis
                </p>
              ) : null}

              {product.shortDescription ? (
                <p className="mt-4 text-lg text-ink-600">{product.shortDescription}</p>
              ) : null}

              <PurchasePanel product={product} />

              <WishlistButton
                productId={product.id}
                variantId={product.variants[0]?.id}
                productSlug={product.slug}
              />

              {/* Les mêmes garanties que la page d'accueil, rappelées là où la
                  décision se prend. Les répéter ici n'est pas une redite : au
                  moment d'ajouter au panier, personne ne remonte vérifier. */}
              <ul className="mt-8 grid gap-3 border-t border-ink-200/70 pt-6 text-sm text-ink-700">
                <li className="flex items-center gap-2.5">
                  <Truck aria-hidden className="size-4 shrink-0 text-ink-500" />
                  Livraison offerte dès 60 € en France métropolitaine
                </li>
                <li className="flex items-center gap-2.5">
                  <RotateCcw aria-hidden className="size-4 shrink-0 text-ink-500" />
                  Retour sous 14 jours, sans justification
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck aria-hidden className="size-4 shrink-0 text-ink-500" />
                  Paiement sécurisé, aucune donnée bancaire conservée
                </li>
              </ul>

              {/* La description accompagne l'achat plutôt que de le suivre :
                  reléguée sous la photo, elle laissait cette colonne à moitié
                  vide et se lisait après le bouton qu'elle devait justifier. */}
              {product.description ? (
                <div className="mt-10 border-t border-ink-200/70 pt-8">
                  <h2 className="font-display text-xl font-semibold text-ink-900">Description</h2>
                  <p className="mt-3 whitespace-pre-line text-ink-700">{product.description}</p>
                </div>
              ) : null}

              {food ? (
                <div className="mt-10 space-y-4 border-t border-ink-200/70 pt-8">
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    Informations réglementaires
                  </h2>

                  {food.requiresColdChain ? (
                    <p className="flex items-center gap-2 text-sm text-ink-700">
                      <Snowflake aria-hidden className="size-4 shrink-0 text-cobalt-600" />
                      Chaîne du froid respectée jusqu’à la livraison.
                    </p>
                  ) : null}

                  {food.allergens.length > 0 ? (
                    <p className="text-sm text-ink-700">
                      <span className="font-medium text-ink-900">Allergènes : </span>
                      {food.allergens.join(', ')}
                    </p>
                  ) : null}

                  {food.ingredients ? (
                    <p className="text-sm text-ink-700">
                      <span className="font-medium text-ink-900">Ingrédients : </span>
                      {food.ingredients}
                    </p>
                  ) : null}

                  {food.storageAdvice ? (
                    <p className="text-sm text-ink-700">
                      <span className="font-medium text-ink-900">Conservation : </span>
                      {food.storageAdvice}
                    </p>
                  ) : null}

                  {food.originCountry ? (
                    <p className="text-sm text-ink-700">
                      <span className="font-medium text-ink-900">Origine : </span>
                      {countryName(food.originCountry)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {product.compliance.warrantyMonths || product.compliance.countryOfOrigin ? (
                <div className="mt-10 space-y-2 border-t border-ink-200/70 pt-8 text-sm text-ink-700">
                  {product.compliance.warrantyMonths ? (
                    <p>Garantie {product.compliance.warrantyMonths} mois.</p>
                  ) : null}
                  {product.compliance.countryOfOrigin ? (
                    <p>Origine : {countryName(product.compliance.countryOfOrigin)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <Reviews summary={reviews} />
        </section>
      </main>

      <Footer />
    </>
  );
}
