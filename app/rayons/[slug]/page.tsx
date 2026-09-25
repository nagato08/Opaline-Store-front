import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { cn } from '@/lib/cn';
import { getCategoryTree, listBrands, listProducts, type ProductSort } from '@/lib/data/catalog';
import { FilterBar } from '@/components/catalog/filter-bar';
import { getCart } from '@/lib/data/cart';

export const dynamic = 'force-dynamic';

/** Tris acceptés dans l'URL ; tout le reste est ignoré. */
const SORTS: ProductSort[] = ['newest', 'price_asc', 'price_desc', 'name_asc', 'best_selling', 'rating'];

function findCategory(tree: Awaited<ReturnType<typeof getCategoryTree>>, slug: string) {
  for (const category of tree) {
    if (category.slug === slug) return category;
    const child = category.children.find((candidate) => candidate.slug === slug);
    if (child) return { ...child, parent: category };
  }
  return undefined;
}

export async function generateMetadata({ params }: PageProps<'/rayons/[slug]'>) {
  const { slug } = await params;
  const categories = await getCategoryTree();
  const department = findCategory(categories, slug);
  return { title: department?.name ?? 'Rayon introuvable' };
}

export default async function DepartmentPage({
  params,
  searchParams,
}: PageProps<'/rayons/[slug]'>) {
  const { slug } = await params;
  const categories = await getCategoryTree();
  const department = findCategory(categories, slug);

  if (!department) notFound();

  const query = await searchParams;
  const activeSlug = typeof query.rayon === 'string' ? query.rayon : undefined;
  const active = department.children.find((sub) => sub.slug === activeSlug);

  /* Les filtres arrivent par l'URL, donc sous forme de texte non vérifié :
     chacun est ramené à une valeur que l'API accepte, sinon une adresse
     bricolée à la main provoquerait une 400 au lieu d'une page. */
  const selectedBrands = [query.marque ?? []].flat().filter((value) => typeof value === 'string');
  const inStockOnly = query.stock === '1';
  const sort = SORTS.includes(query.tri as ProductSort) ? (query.tri as ProductSort) : undefined;

  const listedSlug = active?.slug ?? department.slug;

  const [{ products, total: matching }, departmentTotal, childCounts, allBrands, rayonProducts, cart] =
    await Promise.all([
      listProducts({
        categorySlug: listedSlug,
        perPage: 48,
        sort,
        brandIds: selectedBrands.length > 0 ? selectedBrands : undefined,
        inStockOnly,
      }),
      listProducts({ categorySlug: department.slug, perPage: 1 }).then((page) => page.total),
      Promise.all(
        department.children.map((child) =>
          listProducts({ categorySlug: child.slug, perPage: 1 }).then((page) => [child.slug, page.total] as const),
        ),
      ),
      listBrands(),
      /* Sans filtre : sert à connaître les marques présentes dans le rayon.
         Les tirer de la grille filtrée ferait disparaître une marque dès
         qu'on en sélectionne une autre, et il n'y aurait plus moyen de
         revenir en arrière. */
      listProducts({ categorySlug: listedSlug, perPage: 48 }),
      getCart(),
    ]);

  const total = departmentTotal;
  const counts = Object.fromEntries(childCounts);

  const presentNames = new Set(rayonProducts.products.map((product) => product.brand));
  const brands = allBrands.filter((brand) => presentNames.has(brand.name));

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
              {active ? `${department.name} · ${active.name}` : department.name}
            </span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {active ? active.name : department.name}
          </h1>
          <p className="mt-2 max-w-xl text-ink-600">
            {total} article{total > 1 ? 's' : ''} dans ce rayon.
          </p>

          {/* Onglets de sous-rayon : l'état vit dans l'URL, donc partageable
              et réversible par le bouton « précédent », comme le reste du
              filtrage sur ce projet. */}
          {department.children.length > 1 ? (
            <div className="mt-6 -mx-4 overflow-x-auto px-4 pb-1">
              <div className="flex min-w-max items-center gap-2">
                <Link
                  href={`/rayons/${department.slug}`}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150',
                    !active
                      ? 'bg-ink-900 text-white'
                      : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
                  )}
                >
                  Tout <span className="opacity-70">({total})</span>
                </Link>
                {department.children.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/rayons/${department.slug}?rayon=${sub.slug}`}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                      active?.slug === sub.slug
                        ? 'bg-ink-900 text-white'
                        : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
                    )}
                  >
                    {sub.name} <span className="opacity-70">({counts[sub.slug] ?? 0})</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <FilterBar brands={brands} resultCount={matching} />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          {products.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-clay-100">
                <PackageSearch aria-hidden className="size-6 text-ink-500" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink-900">
                Rien dans ce sous-rayon pour l’instant
              </h2>
              <p className="mt-1.5 max-w-sm text-ink-600">
                Le catalogue s’étoffe régulièrement. Revenez voir, ou parcourez tout le rayon{' '}
                {department.name.toLowerCase()}.
              </p>
              <Link
                href={`/rayons/${department.slug}`}
                className="mt-5 text-sm font-medium text-cobalt-600 hover:underline"
              >
                Voir tout le rayon
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
