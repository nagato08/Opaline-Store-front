import Link from 'next/link';
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
    <footer className="mt-20 border-t border-ink-200/70 bg-clay-50">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-display text-xl font-bold text-ink-900">{store.name}</p>
            <p className="mt-3 max-w-xs text-sm text-ink-600">
              Meubles, électronique et épicerie. Expédié depuis la France, livré
              en France et au Canada.
            </p>
          </div>

          {[shopColumn, ...columns].map((column) => (
            <nav key={column.title} aria-labelledby={`pied-${column.title}`}>
              <h2
                id={`pied-${column.title}`}
                className="font-sans text-sm font-semibold tracking-wide text-ink-900 uppercase"
              >
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 transition-colors duration-150 hover:text-ink-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ink-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} {store.name}. Tous droits réservés.
          </p>
          <p className="text-sm text-ink-500">
            Prix affichés toutes taxes comprises pour la France.
          </p>
        </div>
      </div>
    </footer>
  );
}
