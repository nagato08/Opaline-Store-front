import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Leaf,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ButtonLink } from '@/components/ui/button';
import { PopularProducts } from '@/components/catalog/popular-products';
import { BrandMarquee } from '@/components/marketing/brand-marquee';
import { TiltFrame } from '@/components/marketing/tilt-frame';
import { getCategoryTree, listBrands, listCollections, listHomeReviews, listProducts } from '@/lib/data/catalog';
import { listPosts } from '@/lib/data/content';
import { getCart } from '@/lib/data/cart';
import { discountRate, money, shortDate } from '@/lib/format';

/**
 * Réassurance. Placée juste sous l'accroche parce que c'est là que se joue la
 * première hésitation : un visiteur qui ne connaît pas la boutique cherche à
 * savoir s'il peut lui confier son argent avant de regarder les produits.
 */
const guarantees = [
  { icon: Truck, title: 'Livraison offerte', detail: 'Dès 60 € en France' },
  { icon: RotateCcw, title: 'Retour sous 14 jours', detail: 'Sans justification' },
  { icon: ShieldCheck, title: 'Paiement sécurisé', detail: 'Aucune donnée conservée' },
  { icon: Leaf, title: 'Produits sourcés', detail: 'Fournisseurs identifiés' },
];

/**
 * Trois faits chiffrés, pas des adjectifs.
 *
 * Le chiffre vient avant la phrase parce qu'il se retient : « un seul » dit
 * l'absence de vendeurs tiers mieux qu'une tournure sur la qualité de service,
 * et « 14 jours » engage là où « retours faciles » ne promet rien.
 */
const reasons = [
  {
    figure: 'Un seul',
    title: 'Stock et expéditeur',
    detail:
      'Pas de vendeurs tiers ni de colis séparés : chaque commande part du même entrepôt, quel que soit le rayon.',
  },
  {
    figure: '0 à 4 °C',
    title: 'Chaîne du froid respectée',
    detail:
      'Les produits frais voyagent en glacière jusqu’à la porte — la livraison le signale avant l’achat, pas après.',
  },
  {
    figure: '2 pays',
    title: 'France et Canada, sans surprise',
    detail:
      'Le prix affiché correspond au régime du pays livré — TTC en France, taxes ajoutées au Canada.',
  },
];

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, { products }, newest, brands, collections, { posts }, cart] =
    await Promise.all([
      getCategoryTree(),
      listProducts({ sort: 'rating', perPage: 12 }),
      /* Sert uniquement à poser la pastille « Nouveau » : l'API ne date pas
         les cartes, et seul un tri par date dit lesquelles le sont. */
      listProducts({ sort: 'newest', perPage: 4 }),
      listBrands(),
      listCollections(),
      listPosts(),
      getCart(),
    ]);

  const newIds = newest.products.map((product) => product.id);

  /* Appartenance réelle des produits à leur rayon : le listing ne la porte
     pas, et c'est elle qui alimente les onglets des plus populaires. */
  const departmentMembers = await Promise.all(
    categories.map(async (category) => ({
      name: category.name,
      productIds: (await listProducts({ categorySlug: category.slug, perPage: 48 })).products.map(
        (product) => product.id,
      ),
    })),
  );

  /* Les avis se chargent après le catalogue : ils sont indexés par produit,
     et on n'a les identifiants qu'une fois la liste lue. */
  const homeReviews = await listHomeReviews(products.map((product) => product.id));

  const [hero, ...rest] = products;
  const primaryCategory = categories[0];

  /* Les portes du catalogue : chaque rayon, puis ses sous-rayons jusqu'à six
     vignettes. Un rayon seul en donnerait trois sur une boutique généraliste,
     et la grille paraîtrait vide là où le catalogue ne l'est pas. */
  const departments = [
    ...categories.map((category) => ({
      href: `/rayons/${category.slug}`,
      name: category.name,
      imageUrl: category.imageUrl,
      detail: category.children.map((child) => child.name).join(', ') || 'Voir le rayon',
    })),
    /* Un sous-rayon par rayon à chaque tour, plutôt que tous ceux du premier :
       concaténés, les trois dernières vignettes venaient du même rayon et la
       rangée du bas ne parlait plus que de mobilier. */
    ...Array.from({ length: Math.max(...categories.map((c) => c.children.length), 0) }).flatMap(
      (_, rank) =>
        categories.flatMap((category) => {
          const child = category.children[rank];
          if (!child) return [];
          return [
            {
              href: `/rayons/${category.slug}?rayon=${child.slug}`,
              name: child.name,
              imageUrl: child.imageUrl ?? category.imageUrl,
              detail: category.name,
            },
          ];
        }),
    ),
  ].slice(0, 6);

  /* La plus forte remise réellement en cours : la bande d'offre annonce ce
     chiffre, et l'inventer en ferait une promesse invérifiable. */
  const bestDiscount =
    products
      .filter((product) => product.compareAtCents && product.compareAtCents > product.priceCents)
      .sort(
        (a, b) =>
          b.compareAtCents! / b.priceCents - a.compareAtCents! / a.priceCents,
      )[0] ?? null;

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        {/* --- Accroche -----------------------------------------------------
            Bande beige pleine largeur : elle sépare l'entrée du site du reste
            de la page, qui revient au fond clair. Le texte occupe la gauche,
            la photo du produit mis en avant la droite — une accroche qui ne
            montre rien de ce qu'elle vend est une affiche, pas une boutique. */}
        <section className="bg-linear-to-br from-walnut-100 via-walnut-50 to-clay-100">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
            <div>
              <h1 className="text-4xl leading-[1.08] font-bold text-ink-900 sm:text-5xl lg:text-6xl">
                Le nécessaire,
                <br />
                <span className="text-walnut-500">bien choisi.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg text-ink-700">
                Du canapé au paquet de riz : une sélection courte, des marques
                identifiées, et des prix qui tiennent sans promotion permanente.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {primaryCategory ? (
                  <ButtonLink href={`/rayons/${primaryCategory.slug}`} size="lg" className="px-7">
                    Magasiner maintenant
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/nouveautes" variant="secondary" size="lg">
                  Voir les nouveautés
                </ButtonLink>
              </div>

              {/* Les trois promesses sous l'accroche, pas en bande séparée :
                  elles répondent aux questions qu'on se pose avant de cliquer,
                  et les reléguer plus bas revenait à les poser trop tard. */}
              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                {guarantees.slice(0, 3).map((item) => (
                  <li key={item.title} className="flex items-center gap-2.5">
                    <item.icon aria-hidden className="size-5 shrink-0 text-walnut-500" />
                    <span className="text-sm leading-tight">
                      <span className="block font-medium text-ink-900">{item.title}</span>
                      <span className="block text-ink-600">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {hero?.imageUrl ? (
              <TiltFrame>
                <Link
                  href={`/produits/${hero.slug}`}
                  className="relative block aspect-4/3 overflow-hidden rounded-card bg-surface shadow-lift"
                >
                  <Image
                    src={hero.imageUrl}
                    alt={hero.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    // Image de première vue : chargée en priorité, c'est elle
                    // qui détermine la vitesse perçue de la page.
                    priority
                    className="object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-900/80 to-transparent p-5">
                    <span className="block text-xs tracking-wide text-white/70 uppercase">
                      {hero.brand ?? 'À la une'}
                    </span>
                    <span className="mt-0.5 block font-medium text-white">{hero.name}</span>
                    <span data-price className="mt-1 block text-lg font-semibold text-white">
                      {money(hero.priceCents, hero.currencyCode)}
                    </span>
                  </span>
                </Link>
              </TiltFrame>
            ) : null}
          </div>
        </section>

        {/* --- Rayons -------------------------------------------------------
            Toutes les portes du catalogue, sous-rayons compris : la page
            d'accueil d'une boutique généraliste sert d'abord à trouver son
            rayon, et en cacher la moitié oblige à passer par le menu. La
            vignette porte la photo, le titre et ce qu'on y trouve. */}
        {departments.length > 0 ? (
          <section aria-labelledby="rayons" className="reveal mx-auto mt-16 max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="rayons" className="text-2xl font-bold text-ink-900 sm:text-3xl">
                Explorez par catégorie
              </h2>
              <Link
                href="/recherche"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-walnut-600 transition-colors duration-150 hover:text-walnut-700"
              >
                Voir toutes les catégories
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {departments.map((department) => (
                <Link
                  key={department.href}
                  href={department.href}
                  className="group flex flex-col rounded-card border border-ink-200/80 bg-surface p-3 transition-colors duration-150 hover:border-walnut-300"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-clay-50">
                    {department.imageUrl ? (
                      <Image
                        src={department.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 16vw, (min-width: 768px) 30vw, 45vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </div>

                  <p className="mt-3 font-medium text-ink-900">{department.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                    {department.detail}
                  </p>

                  <ArrowRight
                    aria-hidden
                    className="mt-3 size-4 self-end text-ink-400 transition-colors duration-150 group-hover:text-walnut-600"
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- Offre en cours ------------------------------------------------
            Une bande pleine largeur pour la remise du moment, prise sur les
            promotions réelles : annoncer « jusqu'à -50 % » sans que le
            catalogue le porte est la plus facile des promesses invérifiables. */}
        {bestDiscount ? (
          <section aria-labelledby="offre" className="reveal mt-16 bg-walnut-100">
            <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="relative order-last aspect-16/10 lg:order-first lg:aspect-auto lg:h-full lg:min-h-72">
                {bestDiscount.imageUrl ? (
                  <Image
                    src={bestDiscount.imageUrl}
                    alt={bestDiscount.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="px-4 pb-12 lg:px-0 lg:py-14">
                <h2 id="offre" className="text-3xl font-bold text-ink-900 sm:text-4xl">
                  Jusqu’à {discountRate(bestDiscount.priceCents, bestDiscount.compareAtCents!)} sur
                  une sélection de produits
                </h2>
                <p className="mt-4 max-w-md text-ink-700">
                  Les remises en cours, avec leur date de fin. Le prix barré est celui que nous
                  pratiquions — pas un prix de référence inventé pour l’occasion.
                </p>
                <div className="mt-7">
                  <ButtonLink href="/promotions" size="lg">
                    Découvrir la sélection
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* --- Les plus populaires ------------------------------------------
            Triés par note réelle, pas par choix éditorial : « populaire » est
            une mesure, et l'afficher sans la mesurer serait un classement
            déguisé. Les onglets filtrent par rayon sans quitter la page. */}
        {rest.length > 0 ? (
          <section aria-labelledby="populaires" className="reveal mx-auto mt-16 max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="populaires" className="text-2xl font-bold text-ink-900 sm:text-3xl">
                  Les plus populaires
                </h2>
                <p className="mt-2 text-ink-600">
                  {rest.length} article{rest.length > 1 ? 's' : ''} les mieux notés par nos clients.
                </p>
              </div>

              <Link
                href="/nouveautes"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-walnut-600 transition-colors duration-150 hover:text-walnut-700"
              >
                Tout voir
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>

            <div className="mt-7">
              <PopularProducts
                products={rest}
                departments={departmentMembers}
                newIds={newIds}
              />
            </div>
          </section>
        ) : null}

        {/* --- Sélections ----------------------------------------------------
            Une collection traverse les rayons pour répondre à une intention
            — meubler un salon, monter un coin café — là où le rayon range par
            nature de produit. C'est ce qui fait acheter trois articles plutôt
            qu'un. */}
        {collections.length > 0 ? (
          <section aria-labelledby="selections" className="reveal mx-auto mt-20 max-w-7xl px-4 lg:px-8">
            <h2 id="selections" className="text-2xl font-bold text-ink-900 sm:text-3xl">
              Nos sélections
            </h2>
            <p className="mt-2 max-w-xl text-ink-600">
              Des ensembles pensés pour aller ensemble, d’un rayon à l’autre.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {collections.slice(0, 3).map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group flex flex-col justify-between rounded-card border border-ink-200 p-6 transition-colors duration-150 hover:border-ink-400"
                >
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink-900">
                      {collection.name}
                    </h3>
                    {collection.description ? (
                      <p className="mt-2 text-[15px] text-ink-600">{collection.description}</p>
                    ) : null}
                  </div>

                  <p className="mt-6 flex items-center gap-1.5 text-[15px] font-medium text-walnut-600">
                    {collection.productCount} article{collection.productCount > 1 ? 's' : ''}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <BrandMarquee brands={brands} />

        {/* --- Pourquoi cette boutique ---------------------------------------
            Bande sombre au milieu du parcours. Toute la page est claire, et
            une succession de blocs crème finit par se lire comme un seul bloc :
            cette rupture redonne un repère et marque la fin de la partie
            catalogue.

            Trois faits chiffrés, pas des adjectifs. Le nombre porte la plus
            grande taille de la page après le titre — c'est lui qu'on retient,
            et c'est ce qui différencie un propriétaire unique d'une place de
            marché. */}
        <section aria-labelledby="pourquoi" className="reveal mt-16 bg-walnut-900">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
            <h2 id="pourquoi" className="max-w-xl text-2xl font-bold text-white sm:text-3xl">
              Pourquoi ici plutôt qu’ailleurs
            </h2>

            <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6">
              {reasons.map((reason) => (
                <div key={reason.title}>
                  <p
                    data-numeric
                    className="font-display text-5xl font-bold text-white lg:text-6xl"
                  >
                    {reason.figure}
                  </p>
                  <p className="mt-3 font-display text-lg font-semibold text-white">
                    {reason.title}
                  </p>
                  <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-white/60">
                    {reason.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Épicerie ------------------------------------------------------
            Une bande éditoriale sur fond argile : elle casse la répétition des
            grilles et met en avant le rayon qui fait revenir le client. Le
            rayon épicerie n'existe pas encore forcément dans le catalogue —
            la bande ne s'affiche que si sa catégorie est réellement là. */}
        {(() => {
          const grocery = categories.find((category) => category.slug === 'epicerie');
          if (!grocery) return null;

          return (
            <section className="reveal mt-20 bg-clay-100">
              <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 lg:grid-cols-2 lg:gap-14 lg:px-8">
                <div>
                  <p className="text-sm font-medium tracking-wide text-ink-600 uppercase">
                    {grocery.name}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-ink-900">
                    Les courses aussi, livrées avec le reste.
                  </h2>
                  <p className="mt-4 max-w-md text-ink-700">
                    Produits secs, conserves et boissons, vendus au poids quand c’est
                    pertinent. Dates limites affichées avant l’achat, jamais après.
                  </p>
                  <div className="mt-7">
                    <ButtonLink href={`/rayons/${grocery.slug}`} size="lg">
                      Parcourir {grocery.name.toLowerCase()}
                    </ButtonLink>
                  </div>
                </div>

                {grocery.imageUrl ? (
                  <div className="ratio-wide relative overflow-hidden rounded-card">
                    <Image
                      src={grocery.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </section>
          );
        })()}

        {/* --- Avis clients ----------------------------------------------
            Les avis affichés ici sont **réels** : ils viennent de la
            modération, et la section disparaît tant qu'aucun client n'a écrit.
            Des témoignages inventés seraient une pratique commerciale
            trompeuse, et c'est exactement ce qui se trouvait ici. */}
        {homeReviews.length > 0 ? (
          <section aria-labelledby="avis" className="reveal mx-auto mt-20 max-w-7xl px-4 lg:px-8">
            <h2 id="avis" className="text-2xl font-bold text-ink-900 sm:text-3xl">
              Ce qu’en disent nos clients
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {homeReviews.map((review) => (
                <figure
                  key={review.id}
                  className="flex flex-col rounded-card bg-surface p-6 shadow-card"
                >
                  <div aria-hidden className="flex gap-0.5 text-saffron">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={
                          index < review.rating
                            ? 'size-4 fill-current'
                            : 'size-4 fill-current text-ink-200'
                        }
                      />
                    ))}
                  </div>
                  <span className="sr-only">Note de {review.rating} sur 5</span>

                  <blockquote className="mt-3 flex-1 text-[15px] text-ink-700">
                    “{review.body}”
                  </blockquote>

                  <figcaption className="mt-4 text-sm font-medium text-ink-900">
                    {review.author}
                    {/* La mention n'apparaît que si l'achat est réellement
                        rattaché à une commande : l'afficher partout serait la
                        même tromperie sous une autre forme. */}
                    {review.isVerifiedPurchase ? (
                      <span className="font-normal text-success"> · achat vérifié</span>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- Journal -------------------------------------------------------
            Des articles utiles plutôt que des annonces : entretenir un plateau
            en chêne ou mesurer une cage d'escalier évite un retour, ce qui
            sert le client autant que la boutique. */}
        {posts.length > 0 ? (
          <section aria-labelledby="journal" className="reveal mx-auto mt-20 max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="journal" className="text-2xl font-bold text-ink-900 sm:text-3xl">
                  Du journal
                </h2>
                <p className="mt-2 text-ink-600">
                  Ce qu’il faut savoir avant d’acheter, et après.
                </p>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-walnut-600 transition-colors duration-150 hover:text-walnut-700"
              >
                Tous les articles
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <article key={post.id} className="group flex flex-col">
                  <h3 className="font-display text-lg font-semibold text-ink-900">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{post.excerpt}</p>
                  ) : null}
                  <time
                    dateTime={post.publishedAt}
                    className="mt-3 text-sm text-ink-500"
                  >
                    {shortDate(post.publishedAt)}
                  </time>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- Garanties -----------------------------------------------------
            Les quatre engagements, juste avant le pied de page : c'est le
            dernier doute à lever pour qui a parcouru la page sans acheter.
            La lettre d'information, elle, vit désormais dans le pied de page,
            où elle est atteignable depuis n'importe quel écran. */}
        <section aria-label="Nos engagements" className="reveal mt-16 border-y border-ink-200/70 bg-walnut-50/60">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {guarantees.map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface">
                  <item.icon aria-hidden className="size-5 text-walnut-600" />
                </span>
                <span>
                  <span className="block font-medium text-ink-900">{item.title}</span>
                  <span className="block text-sm text-ink-600">{item.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
