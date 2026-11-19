import Link from 'next/link';
import { Mail, ShoppingBag } from 'lucide-react';
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
    <footer className="mt-20 bg-walnut-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <p className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-xl bg-walnut-500 text-white"
              >
                <ShoppingBag className="size-4.5" />
              </span>
              <span className="font-display text-xl font-bold">{store.name}</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
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
                className="font-sans text-sm font-semibold text-white"
              >
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors duration-150 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* La lettre d'information vit ici plutôt qu'en bande séparée : c'est
            le dernier geste possible avant de quitter la page, et le pied de
            page est le seul endroit présent sur toutes. */}
        <div className="mt-12 border-t border-white/10 pt-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-display text-lg font-semibold">
                Inscrivez-vous à notre lettre d’information
              </p>
              <p className="mt-1.5 text-sm text-white/60">
                Les nouveautés et les promotions, une fois par semaine. Désinscription en un clic.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {store.name}. Tous droits réservés.
          </p>
          <p>Prix affichés toutes taxes comprises pour la France.</p>
        </div>
      </div>
    </footer>
  );
}
