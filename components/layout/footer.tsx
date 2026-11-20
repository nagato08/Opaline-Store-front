import Link from 'next/link';
import { Mail } from 'lucide-react';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import { getCategoryTree } from '@/lib/data/catalog';
import { getStoreSettings } from '@/lib/data/settings';

/**
 * Pied de page.
 *
 * Il porte les mentions que la loi impose d'atteindre depuis n'importe quelle
 * page — CGV, mentions légales, rétractation — et les moyens de contact. Les
 * y reléguer n'est pas de la négligence : c'est leur place attendue, et un
 * client qui les cherche sait où regarder.
 */
/* Les rayons ne sont **pas** listés ici : ils viennent de l'API. La liste
   codée en dur pointait vers `/rayons/meubles` alors que la catégorie
   s'appelle « mobilier » — un lien mort dans le pied de page de chaque page,
   invisible tant que personne ne clique. */
const columns = [
  {
    title: 'Aide',
    links: [
      { href: '/faq', label: 'Questions fréquentes' },
      { href: '/suivi-commande', label: 'Suivre ma commande' },
      { href: '/livraison', label: 'Livraison' },
      { href: '/retours', label: 'Retours et remboursements' },
      { href: '/contact', label: 'Nous contacter' },
    ],
  },
  {
    title: 'La boutique',
    links: [
      { href: '/a-propos', label: 'À propos' },
      { href: '/blog', label: 'Journal' },
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/conditions-generales-de-vente', label: 'CGV' },
    ],
  },
];

export async function Footer() {
  const [categories, store] = await Promise.all([getCategoryTree(), getStoreSettings()]);

  const shopColumn = {
    title: 'Acheter',
    links: [
      ...categories.map((category) => ({
        href: `/rayons/${category.slug}`,
        label: category.name,
      })),
      { href: '/promotions', label: 'Promotions' },
    ],
  };

  return (
    <footer className="mt-24 bg-ink-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        {/* La lettre d'information ouvre le pied de page au lieu de s'y
            cacher : c'est le dernier geste possible avant de quitter, et
            l'enterrer sous quatre colonnes de liens revient à ne pas la
            proposer. */}
        <div className="grid gap-8 border-b border-white/15 pb-14 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">
              Lettre d’information
            </p>
            <p className="mt-4 max-w-lg text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.02] font-bold text-white">
              Les arrivages et les remises, une fois par semaine.
            </p>
            <p className="mt-4 text-sm text-white/55">
              Désinscription en un clic, aucune revente d’adresse.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-2xl leading-none font-bold tracking-[-0.045em]">
              {store.name}
              <span aria-hidden className="text-walnut-300">
                .
              </span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Meubles, électronique et épicerie. Expédié depuis la France, livré
              en France et au Canada.
            </p>

            {/* Les réseaux sociaux attendent que le commerçant ait des
                comptes : des liens vers les pages d'accueil des plateformes
                ne mèneraient à aucun profil. L'adresse, elle, existe. */}
            {store.email ? (
              <a
                href={`mailto:${store.email}`}
                className="mt-6 inline-flex items-center gap-2 text-sm text-white/70 transition-colors duration-150 hover:text-white"
              >
                <Mail aria-hidden className="size-4" />
                {store.email}
              </a>
            ) : null}
          </div>

          {[shopColumn, ...columns].map((column) => (
            <nav key={column.title} aria-labelledby={`pied-${column.title}`}>
              <h2
                id={`pied-${column.title}`}
                className="font-mono text-[11px] tracking-[0.18em] text-white/45 uppercase"
              >
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-white/70 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/15 pt-6 font-mono text-[11px] tracking-wide text-white/45 uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {store.name}. Tous droits réservés.
          </p>
          <p>Prix affichés toutes taxes comprises pour la France.</p>
        </div>
      </div>
    </footer>
  );
}
