import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, Newspaper } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { shortDate } from '@/lib/format';
import { getCategoryTree } from '@/lib/data/catalog';
import { getCart } from '@/lib/data/cart';
import { listPosts } from '@/lib/data/content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Journal' };

export default async function BlogPage() {
  const [{ posts }, categories, cart] = await Promise.all([listPosts(), getCategoryTree(), getCart()]);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Journal</h1>
          <p className="mt-2 text-ink-600">Conseils, coulisses et nouveautés du catalogue.</p>

          {posts.length === 0 ? (
            <div className="mt-14 flex flex-col items-center px-6 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-clay-100">
                <Newspaper aria-hidden className="size-6 text-ink-500" />
              </span>
              <p className="mt-4 text-ink-600">Rien de publié pour l’instant.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="ratio-product relative overflow-hidden rounded-card bg-clay-100">
                      {post.coverUrl ? (
                        <Image
                          src={post.coverUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, 45vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div aria-hidden className="grid size-full place-items-center">
                          <ImageOff className="size-8 text-ink-400" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3.5 text-sm text-ink-500">{shortDate(post.publishedAt)}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-ink-900 group-hover:text-cobalt-600">
                      {post.title}
                    </h2>
                    {post.excerpt ? <p className="mt-1.5 text-[15px] text-ink-600">{post.excerpt}</p> : null}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
