import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContentBlocks } from '@/components/content/blocks';
import { shortDate } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { getPost } from '@/lib/data/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post?.seo.title ?? 'Article introuvable' };
}

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const [post, categories, cart] = await Promise.all([getPost(slug), getCategoryTree(), getCart()]);

  if (!post) notFound();

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <article className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
          <nav aria-label="Fil d’Ariane" className="text-sm text-ink-500">
            <Link href="/blog" className="hover:text-ink-800 hover:underline">
              Journal
            </Link>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">{post.title}</h1>
          <p className="mt-2 text-sm text-ink-500">
            {shortDate(post.publishedAt)}
            {post.authorName ? ` · ${post.authorName}` : ''}
          </p>

          {post.coverUrl ? (
            <div className="ratio-wide relative mt-8 overflow-hidden rounded-card bg-clay-100">
              <Image src={post.coverUrl} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div aria-hidden className="ratio-wide relative mt-8 grid place-items-center overflow-hidden rounded-card bg-clay-100">
              <ImageOff className="size-10 text-ink-400" />
            </div>
          )}

          <div className="mt-8">
            {post.content.blocks.length > 0 ? (
              <ContentBlocks blocks={post.content.blocks} />
            ) : (
              <p className="text-ink-500">Cet article n’a pas encore de contenu.</p>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
