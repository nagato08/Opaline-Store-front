import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContentBlocks } from '@/components/content/blocks';
import { shortDate } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { getPage } from '@/lib/data/content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Conditions générales de vente' };

export default async function TermsPage() {
  const [page, categories, cart] = await Promise.all([
    getPage('conditions-generales-de-vente'),
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
          <p className="mt-2 text-sm text-ink-500">
            Dernière mise à jour le {shortDate(page.publishedAt)}
          </p>

          <div className="mt-8">
            <ContentBlocks blocks={page.content.blocks} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
