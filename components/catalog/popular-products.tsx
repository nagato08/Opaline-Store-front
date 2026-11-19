'use client';

import { useMemo, useState } from 'react';
import { ProductCard, type ProductSummary } from '@/components/product/product-card';
import { cn } from '@/lib/cn';

/**
 * Les plus populaires, filtrables par rayon.
 *
 * Le filtrage se fait sur la liste déjà chargée, sans requête : les douze
 * articles sont en mémoire, et aller les rechercher au serveur à chaque
 * onglet ferait attendre pour un résultat qu'on possède déjà.
 *
 * Les onglets qui ne contiennent rien ne sont pas affichés.
 */
export function PopularProducts({
  products,
  departments,
  newIds = [],
}: {
  products: ProductSummary[];
  /**
   * Rayons et les produits qui leur appartiennent vraiment, résolus au
   * serveur. Déduire le rayon du nom du produit ne marchait pas — « Fauteuil
   * Lisbonne » ne contient pas « Mobilier » — et produisait zéro onglet.
   */
  departments: Array<{ name: string; productIds: string[] }>;
  /** Produits réellement parmi les dernières nouveautés. */
  newIds?: string[];
}) {
  const [active, setActive] = useState<string | null>(null);

  /* Un onglet qui mène à une grille vide donne l'impression d'un rayon en
     rupture alors qu'il s'agit d'un classement par note où ce rayon n'est pas
     monté : on ne garde que ceux qui ont de quoi remplir. */
  const groups = useMemo(
    () =>
      departments.filter((department) =>
        products.some((product) => department.productIds.includes(product.id)),
      ),
    [products, departments],
  );

  const activeGroup = groups.find((department) => department.name === active);
  const shown = activeGroup
    ? products.filter((product) => activeGroup.productIds.includes(product.id))
    : products;

  return (
    <div>
      {groups.length > 0 ? (
        <div className="-mx-4 mb-7 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <div
            role="tablist"
            aria-label="Filtrer par rayon"
            className="flex min-w-max items-center gap-2"
          >
            <Tab selected={active === null} onSelect={() => setActive(null)}>
              Tout
            </Tab>
            {groups.map((department) => (
              <Tab
                key={department.name}
                selected={active === department.name}
                onSelect={() => setActive(department.name)}
              >
                {department.name}
              </Tab>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.slice(0, 10).map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 5}
            isNew={newIds.includes(product.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Tab({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut-500',
        selected
          ? 'bg-walnut-500 text-white'
          : 'bg-walnut-50 text-ink-700 hover:bg-walnut-100',
      )}
    >
      {children}
    </button>
  );
}
