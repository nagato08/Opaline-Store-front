import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { getCategoryTree, listCollections, listProducts } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/collections/[slug]'>) {
  const { slug } = await params;
  const collection = (await listCollections()).find((entry) => entry.slug === slug);

  return {
    title: collection?.name ?? 'Sélection introuvable',
    description: collection?.description ?? undefined,
  };
}

/**
 * Sélection thématique.
 *
 * Une collection n'est pas un rayon : elle traverse les catégories pour
 * répondre à une intention — meubler un salon, monter un coin café — là où le
 * rayon répond à une nature de produit. C'est la page qui donne un sens à un
 * panier composé de trois familles différentes.
 */
export default async function CollectionPage({ params }: PageProps<'/collections/[slug]'>) {
  const { slug } = await params;

  const [collections, categories, cart] = await Promise.all([
    listCollections(),
    getCategoryTree(),
    getCart(),
  ]);

  const collection = collections.find((entry) => entry.slug === slug);
  if (!collection) notFound();

  const { products } = await listProducts({ collectionSlug: slug, perPage: 48 });

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
          <nav aria-label="Fil d’Ariane" className="text-sm text-ink-500">
            <Link href="/" className="hover:text-ink-800 hover:underline">
              Accueil
            </Link>
            <span aria-hidden className="mx-1.5">
              /
            </span>
            <span className="text-ink-700" aria-current="page">
              {collection.name}
            </span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">{collection.name}</h1>
          {collection.description ? (
            <p className="mt-3 max-w-2xl text-lg text-ink-600">{collection.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-ink-500">
            {products.length} article{products.length > 1 ? 's' : ''} dans cette sélection.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
