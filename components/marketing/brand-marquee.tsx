import Link from 'next/link';
import type { Brand } from '@/lib/data/catalog';

/**
 * Bandeau de marques qui défile en continu.
 *
 * Le catalogue tient sur une poignée de fournisseurs identifiés, et c'est un
 * argument de vente que la page d'accueil n'exploitait pas : les noms
 * n'apparaissaient nulle part avant la fiche produit.
 *
 * Deux copies de la même liste se suivent et l'animation translate l'ensemble
 * d'exactement une copie : à la fin du cycle, la seconde occupe la position de
 * la première et la boucle est invisible. C'est la seule façon d'obtenir un
 * défilement sans couture sans mesurer quoi que ce soit en JavaScript.
 *
 * Composant serveur : il n'a aucun état, tout est en CSS.
 */
export function BrandMarquee({ brands }: { brands: Brand[] }) {
  if (brands.length < 3) return null;

  return (
    <section aria-labelledby="marques" className="mt-20 overflow-hidden border-y border-ink-200/70 py-6">
      <h2 id="marques" className="sr-only">
        Nos marques
      </h2>

      {/* La liste complète est lisible sans animation par les lecteurs
          d'écran ; la copie est masquée pour ne pas annoncer deux fois les
          mêmes noms. */}
      <div className="marquee flex w-max items-center gap-12 pr-12">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center gap-12"
          >
            {brands.map((brand) => (
              <li key={`${copy}-${brand.id}`}>
                <Link
                  href={`/recherche?marque=${encodeURIComponent(brand.id)}`}
                  className="font-display text-xl font-semibold whitespace-nowrap text-ink-400 transition-colors duration-150 hover:text-ink-900"
                  tabIndex={copy === 1 ? -1 : undefined}
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
