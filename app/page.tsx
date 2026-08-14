import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Leaf,
  RotateCcw,
  ShieldCheck,
  Snowflake,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import { ButtonLink } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { departments, featured, testimonials } from '@/lib/demo';

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
 * Ce qui distingue une boutique à propriétaire unique d'une place de marché —
 * trois faits vérifiables, pas des adjectifs.
 */
const reasons = [
  {
    icon: Store,
    title: 'Un seul stock, un seul expéditeur',
    detail:
      'Pas de vendeurs tiers ni de colis séparés : chaque commande part du même entrepôt, quel que soit le rayon.',
  },
  {
    icon: Snowflake,
    title: 'Chaîne du froid respectée',
    detail:
      'Les produits frais voyagent en glacière jusqu’à la porte — la livraison le signale avant l’achat, pas après.',
  },
  {
    icon: ShieldCheck,
    title: 'France et Canada, sans surprise à la caisse',
    detail:
      'Le prix affiché correspond au régime du pays livré — TTC en France, taxes ajoutées au Canada.',
  },
];

const averageRating =
  testimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0) / testimonials.length;

export default function HomePage() {
  const [hero, ...rest] = featured;

  return (
    <>
      <Header cartCount={2} />

      <main>
        {/* --- Accroche -----------------------------------------------------
            Asymétrique : le texte occupe deux colonnes sur cinq, l'image le
            reste. Une accroche centrée sur fond dégradé est le réflexe par
            défaut ; ici l'objet vendu prend la place, ce qui est plus honnête
            pour une boutique. */}
        <section className="mx-auto max-w-7xl px-4 pt-10 lg:px-8 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
            <div className="lg:col-span-2">
              <p className="text-sm font-medium tracking-wide text-saffron uppercase">
                Nouvelle collection
              </p>
              <h1 className="mt-4 text-4xl font-bold text-ink-900 sm:text-5xl lg:text-6xl">
                Le nécessaire,
                <br />
                bien choisi.
              </h1>
              <p className="mt-5 max-w-md text-lg text-ink-600">
                Du canapé au paquet de riz : une sélection courte, des marques
                identifiées, et des prix qui tiennent sans promotion permanente.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/rayons/meubles" size="lg" className="px-7">
                  Découvrir les meubles
                </ButtonLink>
                <ButtonLink href="/nouveautes" variant="secondary" size="lg">
                  Voir les nouveautés
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="ratio-wide relative overflow-hidden rounded-card bg-clay-100">
                <Image
                  src={hero.imageUrl}
                  alt={hero.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  // Image de première vue : chargée en priorité, c'est elle qui
                  // détermine la vitesse perçue de la page.
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- Réassurance -------------------------------------------------- */}
        <section aria-label="Nos engagements" className="mx-auto mt-14 max-w-7xl px-4 lg:px-8">
          <ul className="grid gap-x-6 gap-y-5 border-y border-ink-200/70 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <item.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-cobalt-500" />
                <span>
                  <span className="block text-[15px] font-medium text-ink-900">
                    {item.title}
                  </span>
                  <span className="block text-sm text-ink-500">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Rayons -------------------------------------------------------
            Trois entrées seulement : le catalogue est généraliste, mais une
            page d'accueil qui propose douze portes n'en fait ouvrir aucune. */}
        <section aria-labelledby="rayons" className="mx-auto mt-20 max-w-7xl px-4 lg:px-8">
          <h2 id="rayons" className="text-2xl font-bold text-ink-900 sm:text-3xl">
            Nos rayons
          </h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            {departments.map((department) => (
              <Link
                key={department.slug}
                href={`/rayons/${department.slug}`}
                className="group relative overflow-hidden rounded-card bg-clay-100"
              >
                <div className="relative aspect-[16/9] sm:aspect-[3/4]">
                  <Image
                    src={department.imageUrl}
                    alt={department.imageAlt}
                    fill
                    sizes="(min-width: 640px) 32vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  {/* Voile sombre du bas : garantit le contraste du texte quelle
                      que soit la photo mise en avant par le client. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent"
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-xl font-semibold text-white">
                    {department.label}
                  </p>
                  <p className="mt-0.5 text-sm text-white/85">{department.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- Sélection ----------------------------------------------------- */}
        <section aria-labelledby="selection" className="mx-auto mt-20 max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="selection" className="text-2xl font-bold text-ink-900 sm:text-3xl">
                La sélection du moment
              </h2>
              <p className="mt-2 text-ink-600">
                {rest.length} articles choisis, renouvelés chaque semaine.
              </p>
            </div>

            <Link
              href="/nouveautes"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-cobalt-600 transition-colors duration-150 hover:text-cobalt-700"
            >
              Tout voir
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
            {rest.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
        </section>

        {/* --- Pourquoi cette boutique ---------------------------------------
            Trois faits, pas des adjectifs : c'est ce qui différencie
            réellement un propriétaire unique d'une place de marché, et c'est
            la question qu'un visiteur qui ne connaît pas l'enseigne se pose
            avant d'ajouter au panier. */}
        <section aria-labelledby="pourquoi" className="mx-auto mt-20 max-w-7xl px-4 lg:px-8">
          <h2 id="pourquoi" className="text-2xl font-bold text-ink-900 sm:text-3xl">
            Pourquoi ici plutôt qu’ailleurs
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {reasons.map((reason) => (
              <div key={reason.title} className="rounded-card bg-clay-50 p-6">
                <span className="grid size-11 place-items-center rounded-full bg-surface shadow-card">
                  <reason.icon aria-hidden className="size-5 text-cobalt-600" />
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-ink-900">
                  {reason.title}
                </p>
                <p className="mt-1.5 text-[15px] text-ink-600">{reason.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- Épicerie ------------------------------------------------------
            Une bande éditoriale sur fond argile : elle casse la répétition des
            grilles et met en avant le rayon qui fait revenir le client. */}
        <section className="mt-20 bg-clay-100">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 lg:grid-cols-2 lg:gap-14 lg:px-8">
            <div>
              <p className="text-sm font-medium tracking-wide text-ink-600 uppercase">
                Épicerie
              </p>
              <h2 className="mt-3 text-3xl font-bold text-ink-900">
                Les courses aussi, livrées avec le reste.
              </h2>
              <p className="mt-4 max-w-md text-ink-700">
                Produits secs, conserves et boissons, vendus au poids quand c’est
                pertinent. Dates limites affichées avant l’achat, jamais après.
              </p>
              <div className="mt-7">
                <ButtonLink href="/rayons/epicerie" size="lg">
                  Parcourir l’épicerie
                </ButtonLink>
              </div>
            </div>

            <div className="ratio-wide relative overflow-hidden rounded-card">
              <Image
                src={departments[2].imageUrl}
                alt={departments[2].imageAlt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* --- Avis clients ---------------------------------------------- */}
        <section aria-labelledby="avis" className="mx-auto mt-20 max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="avis" className="text-2xl font-bold text-ink-900 sm:text-3xl">
              Ce qu’en disent nos clients
            </h2>
            <p className="flex items-center gap-1.5 text-[15px] text-ink-600">
              <Star aria-hidden className="size-4 fill-current text-saffron" />
              <span className="font-semibold text-ink-900">{averageRating.toFixed(1)}</span>
              sur 5, avis vérifiés
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.author}
                className="flex flex-col rounded-card bg-surface p-6 shadow-card"
              >
                <div aria-hidden className="flex gap-0.5 text-saffron">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={
                        index < testimonial.rating
                          ? 'size-4 fill-current'
                          : 'size-4 fill-current text-ink-200'
                      }
                    />
                  ))}
                </div>
                <span className="sr-only">Note de {testimonial.rating} sur 5</span>

                <blockquote className="mt-3 flex-1 text-[15px] text-ink-700">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="mt-4 text-sm font-medium text-ink-900">
                  {testimonial.author}
                  <span className="font-normal text-ink-500"> · {testimonial.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* --- Lettre d'information ---------------------------------------
            Bande sombre : elle marque une rupture volontaire avec le reste de
            la page, pour signaler que ce n'est plus un rayon mais un dernier
            geste avant de partir. */}
        <section className="mt-20 bg-ink-900">
          <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
            <p className="text-sm font-medium tracking-wide text-white/60 uppercase">
              Lettre d’information
            </p>
            <h2 className="mt-3 max-w-lg text-2xl font-bold text-white sm:text-3xl">
              Les nouveautés et les promotions, une fois par semaine.
            </h2>
            <p className="mt-3 max-w-md text-white/70">
              Pas de sollicitation quotidienne — un seul courriel, désinscription en un clic.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
