import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Leaf, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ButtonLink } from '@/components/ui/button';
import { SectionHead } from '@/components/ui/section-head';
import { PopularProducts } from '@/components/catalog/popular-products';
import { ProductCard } from '@/components/product/product-card';
import { BrandMarquee } from '@/components/marketing/brand-marquee';
import { getCategoryTree, listBrands, listCollections, listHomeReviews, listProducts } from '@/lib/data/catalog';
import { listPosts } from '@/lib/data/content';
import { getCart } from '@/lib/data/cart';
import { discountRate, money, shortDate } from '@/lib/format';

/**
 * Réassurance, en bandeau défilant plutôt qu'en rangée de cartes à icônes.
 *
 * Quatre vignettes identiques sous l'accroche sont le réflexe du gabarit
 * acheté : on les reconnaît, donc on ne les lit pas. Une bande sombre en
 * chasse fixe dit la même chose en occupant le dixième de la hauteur.
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

  /* Les portes du catalogue : chaque rayon, puis ses sous-rayons jusqu'à cinq
     vignettes — la mosaïque en compte cinq, la première occupant quatre
     cellules. */
  const departments = [
    ...categories.map((category) => ({
      href: `/rayons/${category.slug}`,
      name: category.name,
      imageUrl: category.imageUrl,
      detail: category.children.map((child) => child.name).join(', ') || 'Voir le rayon',
    })),
    /* Un sous-rayon par rayon à chaque tour, plutôt que tous ceux du premier :
       concaténés, les dernières vignettes venaient du même rayon et la rangée
       du bas ne parlait plus que de mobilier. */
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
  ].slice(0, 5);

  /* La plus forte remise réellement en cours : la bande d'offre annonce ce
     chiffre, et l'inventer en ferait une promesse invérifiable. */
  const bestDiscount =
    products
      .filter((product) => product.compareAtCents && product.compareAtCents > product.priceCents)
      .sort(
        (a, b) =>
          b.compareAtCents! / b.priceCents - a.compareAtCents! / a.priceCents,
      )[0] ?? null;

  /* Numérotation des chapitres, calculée au fil du rendu : les sections
     disparaissent quand leur source est vide, et une suite codée en dur
     sauterait des numéros sur un catalogue partiel. */
  let chapter = 0;
  const next = () => (chapter += 1);

  return (
    <>
      <Header categories={categories} cartCount={cart.lines.length} />

      <main>
        {/* --- Accroche -----------------------------------------------------
            Le produit occupe l'écran entier et le titre se pose dessus. Une
            accroche coupée en deux — texte à gauche, vignette à droite —
            donne deux demi-images et aucune impression ; une photo pleine
            largeur en donne une seule, mais elle tient.

            Le dégradé ne décore pas : il garantit le contraste du texte quelle
            que soit la photo que le commerçant met en avant. */}
        <section className="relative isolate flex min-h-[82svh] items-end overflow-hidden bg-ink-900">
          {hero?.imageUrl ? (
            <Image
              src={hero.imageUrl}
              alt={hero.imageAlt}
              fill
              sizes="100vw"
              // Image de première vue : c'est elle qui décide de la vitesse
              // perçue de la page.
              priority
              className="object-cover"
            />
          ) : null}

          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/55 to-ink-900/10"
          />

          <div className="relative mx-auto w-full max-w-7xl px-4 pt-28 pb-12 lg:px-8 lg:pb-16">
            <p className="font-mono text-xs tracking-[0.2em] text-white/55 uppercase">
              Mobilier · Électronique · Épicerie
            </p>

            <h1 className="mt-6 max-w-4xl text-[clamp(2.75rem,8vw,6.5rem)] font-bold text-white">
              Le nécessaire,
              <br />
              bien choisi.
            </h1>

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <p className="max-w-md text-lg text-white/75">
                Du canapé au paquet de riz : une sélection courte, des marques
                identifiées, et des prix qui tiennent sans promotion permanente.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {primaryCategory ? (
                  <ButtonLink href={`/rayons/${primaryCategory.slug}`} size="lg" className="px-8">
                    Entrer dans la boutique
                  </ButtonLink>
                ) : null}

                {/* La vedette reste atteignable d'un clic : c'est elle qu'on
                    regarde, autant pouvoir l'ouvrir. */}
                {hero ? (
                  <Link
                    href={`/produits/${hero.slug}`}
                    className="inline-flex h-12 items-center gap-3 border border-white/30 px-5 text-[15px] text-white transition-colors duration-150 hover:bg-white/10"
                  >
                    <span className="text-white/60">À l’affiche</span>
                    <span className="font-medium">{hero.name}</span>
                    <span data-price className="font-semibold">
                      {money(hero.priceCents, hero.currencyCode)}
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* --- Bandeau d'engagements -----------------------------------------
            Une ligne sombre, en chasse fixe, qui défile lentement. Elle tient
            la promesse de réassurance sans voler une pleine section à la
            vente, et elle sert de respiration entre la photo d'accroche et la
            première grille. La liste est écrite deux fois : le raccord du
            défilement se fait à la moitié de la piste. */}
        <section aria-label="Nos engagements" className="overflow-hidden bg-ink-900 py-3.5">
          <div className="marquee flex w-max gap-10 pl-10">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 gap-10" aria-hidden={copy === 1}>
                {guarantees.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-center gap-2.5 font-mono text-xs tracking-[0.14em] whitespace-nowrap text-white/75 uppercase"
                  >
                    <item.icon aria-hidden className="size-3.5 text-walnut-300" />
                    {item.title}
                    <span aria-hidden className="text-white/25">
                      ·
                    </span>
                    <span className="text-white/45">{item.detail}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        {/* --- Rayons -------------------------------------------------------
            Mosaïque asymétrique : la première porte occupe quatre cellules,
            les autres une seule. Une grille de six vignettes égales ne
            hiérarchise rien et se lit comme un sommaire ; ici l'œil sait par
            où entrer.

            Le nom se pose sur la photo plutôt qu'en dessous : la vignette
            devient l'objet, pas la légende d'une carte. */}
        {departments.length > 0 ? (
          <section
            aria-labelledby="rayons"
            className="reveal mx-auto mt-20 max-w-7xl px-4 lg:px-8"
          >
            <SectionHead
              index={next()}
              label="Le catalogue"
              id="rayons"
              title="Cinq portes d’entrée, un seul entrepôt."
              href="/recherche"
              linkLabel="Toutes les catégories"
            />

            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
              {departments.map((department, rank) => (
                <Link
                  key={department.href}
                  href={department.href}
                  className={
                    'group relative isolate flex items-end overflow-hidden bg-ink-900 ' +
                    (rank === 0
                      ? 'col-span-2 row-span-2 aspect-square lg:aspect-auto lg:min-h-[32rem]'
                      : 'aspect-4/5 lg:aspect-auto lg:min-h-[15.5rem]')
                  }
                >
                  {department.imageUrl ? (
                    <Image
                      src={department.imageUrl}
                      alt=""
                      fill
                      sizes={
                        rank === 0
                          ? '(min-width: 1024px) 50vw, 100vw'
                          : '(min-width: 1024px) 25vw, 50vw'
                      }
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}

                  <div
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-ink-900/85 via-ink-900/20 to-transparent"
                  />

                  <div className="relative w-full p-4 sm:p-5">
                    <p className="font-mono text-[11px] tracking-[0.18em] text-white/55">
                      {String(rank + 1).padStart(2, '0')}
                    </p>
                    <p
                      className={
                        'mt-1 font-display font-semibold text-white ' +
                        (rank === 0 ? 'text-3xl sm:text-4xl' : 'text-lg')
                      }
                    >
                      {department.name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-white/55">
                      {department.detail}
                    </p>
                  </div>

                  {/* Le filet se remplit au survol : un soulignement qui
                      s'étend dit « on va quelque part » sans déplacer la
                      carte, donc sans faire danser la grille. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-4 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100 sm:inset-x-5"
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- Les plus populaires ------------------------------------------
            Triés par note réelle, pas par choix éditorial : « populaire » est
            une mesure, et l'afficher sans la mesurer serait un classement
            déguisé. Les onglets filtrent par rayon sans quitter la page. */}
        {rest.length > 0 ? (
          <section
            aria-labelledby="populaires"
            className="reveal mx-auto mt-24 max-w-7xl px-4 lg:px-8"
          >
            <SectionHead
              index={next()}
              label="Les mieux notés"
              id="populaires"
              title="Ce que les clients gardent."
              lead={`${rest.length} articles classés par la note qu’ils ont réellement reçue — aucun ordre acheté, aucun produit remonté à la main.`}
              href="/nouveautes"
              linkLabel="Tout voir"
            />

            <div className="mt-10">
              <PopularProducts products={rest} departments={departmentMembers} newIds={newIds} />
            </div>
          </section>
        ) : null}

        {/* --- Offre en cours ------------------------------------------------
            Pleine largeur, fond encre, et la remise écrite en chiffres de la
            taille du titre d'accroche. Le pourcentage est pris sur les
            promotions réelles : annoncer « jusqu'à -50 % » sans que le
            catalogue le porte est la plus facile des promesses invérifiables. */}
        {bestDiscount ? (
          <section aria-labelledby="offre" className="reveal mt-24 bg-ink-900">
            <div className="mx-auto grid max-w-7xl items-stretch gap-0 lg:grid-cols-5">
              <div className="relative order-last aspect-16/10 lg:order-first lg:col-span-2 lg:aspect-auto">
                {bestDiscount.imageUrl ? (
                  <Image
                    src={bestDiscount.imageUrl}
                    alt={bestDiscount.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    loading="lazy"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="px-4 py-14 lg:col-span-3 lg:px-14 lg:py-20">
                <p className="font-mono text-xs tracking-[0.18em] text-white/50 uppercase">
                  Remises en cours
                </p>

                <p
                  data-numeric
                  className="mt-5 font-display text-[clamp(4rem,12vw,9rem)] leading-[0.8] font-bold tracking-[-0.04em] text-white"
                >
                  {discountRate(bestDiscount.priceCents, bestDiscount.compareAtCents!)}
                </p>

                <h2 id="offre" className="mt-6 max-w-md text-2xl font-semibold text-white">
                  sur une sélection de produits, jusqu’à épuisement.
                </h2>

                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/60">
                  Le prix barré est celui que nous pratiquions — pas un prix de référence
                  inventé pour l’occasion.
                </p>

                <div className="mt-8">
                  <ButtonLink
                    href="/promotions"
                    size="lg"
                    className="bg-white text-ink-900 hover:bg-white/90 active:bg-white/80"
                  >
                    Découvrir la sélection
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* --- Nouveautés -----------------------------------------------------
            Les dernières entrées au catalogue : elles répondent à une autre
            question que les mieux notés — non pas « qu'est-ce qui est bien ? »
            mais « qu'est-ce que je n'ai pas encore vu ? ». */}
        {newest.products.length > 0 ? (
          <section
            aria-labelledby="nouveautes"
            className="reveal mx-auto mt-24 max-w-7xl px-4 lg:px-8"
          >
            <SectionHead
              index={next()}
              label="Arrivages"
              id="nouveautes"
              title="Ce qui vient d’entrer."
              href="/nouveautes"
              linkLabel="Toutes les nouveautés"
            />

            <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
              {newest.products.map((product) => (
                <ProductCard key={product.id} product={product} isNew />
              ))}
            </div>
          </section>
        ) : null}

        {/* --- Sélections ----------------------------------------------------
            Une collection traverse les rayons pour répondre à une intention
            — meubler un salon, monter un coin café — là où le rayon range par
            nature de produit. C'est ce qui fait acheter trois articles plutôt
            qu'un.

            Rendues en liste à filets plutôt qu'en cartes : une sélection est
            un titre et un nombre, et l'encadrer n'y ajoute rien. */}
        {collections.length > 0 ? (
          <section
            aria-labelledby="selections"
            className="reveal mx-auto mt-24 max-w-7xl px-4 lg:px-8"
          >
            <SectionHead
              index={next()}
              label="Sélections"
              id="selections"
              title="Des ensembles qui tiennent debout."
              lead="Pensés pour aller ensemble, d’un rayon à l’autre."
            />

            <ul className="mt-10 border-t border-ink-900/15">
              {collections.slice(0, 4).map((collection) => (
                <li key={collection.id} className="border-b border-ink-900/15">
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="group flex flex-wrap items-baseline gap-x-8 gap-y-2 py-6 transition-colors duration-150 hover:bg-ink-900/[0.03] sm:py-8"
                  >
                    <h3 className="flex-1 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                      {collection.name}
                    </h3>

                    {collection.description ? (
                      <p className="max-w-sm flex-1 text-[15px] text-ink-600">
                        {collection.description}
                      </p>
                    ) : null}

                    <p className="flex items-center gap-3 font-mono text-sm text-ink-500">
                      {collection.productCount} art.
                      <ArrowRight
                        aria-hidden
                        className="size-4 text-ink-900 transition-transform duration-150 group-hover:translate-x-1"
                      />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <BrandMarquee brands={brands} />

        {/* --- Pourquoi cette boutique ---------------------------------------
            Bande vert profond au milieu du parcours. Toute la page est claire,
            et une succession de blocs crème finit par se lire comme un seul
            bloc : cette rupture redonne un repère.

            Trois faits chiffrés, pas des adjectifs. Le nombre porte la plus
            grande taille de la page après le titre — c'est lui qu'on retient,
            et c'est ce qui différencie un propriétaire unique d'une place de
            marché. */}
        <section aria-labelledby="pourquoi" className="reveal mt-24 bg-walnut-900">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <SectionHead
              index={next()}
              label="La maison"
              id="pourquoi"
              title="Pourquoi ici plutôt qu’ailleurs."
              tone="dark"
            />

            <dl className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-8">
              {reasons.map((reason) => (
                <div key={reason.title} className="border-t border-white/20 pt-6">
                  <dt
                    data-numeric
                    className="font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.9] font-bold text-white"
                  >
                    {reason.figure}
                  </dt>
                  <dd>
                    <p className="mt-4 font-display text-lg font-semibold text-white">
                      {reason.title}
                    </p>
                    <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-white/60">
                      {reason.detail}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --- Épicerie ------------------------------------------------------
            Une bande éditoriale : elle casse la répétition des grilles et met
            en avant le rayon qui fait revenir le client. Le rayon épicerie
            n'existe pas forcément dans le catalogue — la bande ne s'affiche
            que si sa catégorie est réellement là. */}
        {(() => {
          const grocery = categories.find((category) => category.slug === 'epicerie');
          if (!grocery) return null;

          return (
            <section className="reveal mx-auto mt-24 max-w-7xl px-4 lg:px-8">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <SectionHead
                    index={next()}
                    label={grocery.name}
                    title="Les courses aussi, livrées avec le reste."
                    lead="Produits secs, conserves et boissons, vendus au poids quand c’est pertinent. Dates limites affichées avant l’achat, jamais après."
                  />
                  <div className="mt-8">
                    <ButtonLink href={`/rayons/${grocery.slug}`} size="lg">
                      Parcourir {grocery.name.toLowerCase()}
                    </ButtonLink>
                  </div>
                </div>

                {grocery.imageUrl ? (
                  <div className="relative aspect-4/3 overflow-hidden">
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
            trompeuse.

            Pas de carte, pas d'ombre : une citation au grand corps, séparée
            par un filet. Un avis se lit, il ne se clique pas. */}
        {homeReviews.length > 0 ? (
          <section aria-labelledby="avis" className="reveal mx-auto mt-24 max-w-7xl px-4 lg:px-8">
            <SectionHead
              index={next()}
              label="Avis vérifiés"
              id="avis"
              title="Ce qu’en disent les clients."
            />

            <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {homeReviews.map((review) => (
                <figure key={review.id} className="flex flex-col border-t border-ink-900/15 pt-6">
                  <div aria-hidden className="flex gap-0.5 text-saffron">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={
                          index < review.rating
                            ? 'size-3.5 fill-current'
                            : 'size-3.5 fill-current text-ink-200'
                        }
                      />
                    ))}
                  </div>
                  <span className="sr-only">Note de {review.rating} sur 5</span>

                  <blockquote className="mt-4 flex-1 font-display text-xl leading-snug font-medium text-ink-900">
                    « {review.body} »
                  </blockquote>

                  <figcaption className="mt-5 font-mono text-xs tracking-wide text-ink-500 uppercase">
                    {review.author}
                    {/* La mention n'apparaît que si l'achat est réellement
                        rattaché à une commande : l'afficher partout serait la
                        même tromperie sous une autre forme. */}
                    {review.isVerifiedPurchase ? (
                      <span className="text-success"> · achat vérifié</span>
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
          <section
            aria-labelledby="journal"
            className="reveal mx-auto mt-24 max-w-7xl px-4 lg:px-8"
          >
            <SectionHead
              index={next()}
              label="Le journal"
              id="journal"
              title="À savoir avant d’acheter, et après."
              href="/blog"
              linkLabel="Tous les articles"
            />

            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <li key={post.id} className="border-t border-ink-900/15 pt-6">
                  <article>
                    <time
                      dateTime={post.publishedAt}
                      className="font-mono text-xs tracking-wide text-ink-500 uppercase"
                    >
                      {shortDate(post.publishedAt)}
                    </time>

                    <h3 className="mt-3 font-display text-xl leading-tight font-semibold text-ink-900">
                      <Link href={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt ? (
                      <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
