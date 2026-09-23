import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContentBlocks } from '@/components/content/blocks';
import { shortDate } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { getPage } from '@/lib/data/content';

export const dynamic = 'force-dynamic';

/**
 * Page éditoriale, adressée par son identifiant d'URL.
 *
 * Sans cette route, une page créée dans le back-office restait inatteignable :
 * seules trois adresses fixes savaient afficher du contenu, et « Mentions
 * légales » — obligatoire — renvoyait un 404 alors que la page existait dans
 * l'API.
 *
 * Un segment statique l'emporte toujours sur ce segment dynamique : `/panier`,
 * `/blog` ou `/recherche` continuent d'être servis par leurs propres routes,
 * et une page éditoriale qui porterait l'un de ces identifiants serait
 * simplement masquée.
 */
export async function generateMetadata({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title ?? 'Page introuvable' };
}

export default async function ContentPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params;

  const [page, categories, cart] = await Promise.all([
    getPage(slug),
    getCategoryTree(),
    getCart(),
  ]);

  if (!page) notFound();

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900">{page.title}</h1>
          {page.publishedAt ? (
            <p className="mt-2 text-sm text-ink-500">
              Dernière mise à jour le {shortDate(page.publishedAt)}
            </p>
          ) : null}

          <div className="mt-8">
            <ContentBlocks blocks={page.content.blocks} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
