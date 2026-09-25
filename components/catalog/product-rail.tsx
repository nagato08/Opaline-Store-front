'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard, type ProductSummary } from '@/components/product/product-card';
import { cn } from '@/lib/cn';

/**
 * Rail horizontal de produits.
 *
 * Une grille de douze articles sur la page d'accueil demande de faire défiler
 * trois écrans pour arriver au reste de la page ; le même contenu tient ici en
 * une bande qu'on parcourt latéralement, et la page redevient lisible d'un
 * coup d'œil.
 *
 * Le défilement reste celui du navigateur — inertie, geste tactile, molette
 * horizontale, barre de défilement au clavier — avec seulement un ancrage
 * (`scroll-snap`) pour que les cartes s'alignent. Les flèches ne sont qu'un
 * raccourci de plus, pas le seul moyen d'avancer : un carrousel qui n'obéit
 * qu'à ses propres boutons se ferme au clavier comme au doigt.
 */
export function ProductRail({ products }: { products: ProductSummary[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* Les flèches disparaissent au bout de la course : un bouton qui ne fait
     rien use la confiance plus vite qu'il ne rend service. */
  useEffect(() => {
    const element = rail.current;
    if (!element) return;

    const measure = () => {
      const max = element.scrollWidth - element.clientWidth;
      setAtStart(element.scrollLeft <= 8);
      setAtEnd(element.scrollLeft >= max - 8);
    };

    measure();
    element.addEventListener('scroll', measure, { passive: true });

    /* La largeur change au redimensionnement et à l'arrivée des images :
       sans observateur, la flèche de droite resterait affichée sur un rail
       devenu assez court pour tout montrer. */
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      element.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, []);

  function nudge(direction: 1 | -1) {
    const element = rail.current;
    if (!element) return;

    /* Un écran de large, moins une carte : on garde un repère visuel entre
       deux pages plutôt que de tout remplacer. */
    element.scrollBy({ left: direction * (element.clientWidth * 0.8), behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={rail}
        // `overflow-y-visible` refusé par le navigateur sur un axe qui défile :
        // la marge verticale laisse la place au relief des cartes au survol.
        className="rail -mx-4 flex snap-x gap-5 overflow-x-auto px-4 py-2 lg:-mx-8 lg:px-8"
      >
        {products.map((product, index) => (
          <div key={product.id} className="w-[45vw] shrink-0 sm:w-[30vw] xl:w-[22vw]">
            <ProductCard product={product} priority={index < 3} />
          </div>
        ))}
      </div>

      {/* Fondu aux extrémités : il dit qu'il y a encore quelque chose derrière
          le bord, ce qu'une coupe nette ne dit pas. Purement décoratif, donc
          sans prise au pointeur. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-canvas to-transparent transition-opacity duration-200 lg:-left-8',
          atStart && 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-canvas to-transparent transition-opacity duration-200 lg:-right-8',
          atEnd && 'opacity-0',
        )}
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atStart}
          aria-label="Article précédent"
          className="grid size-10 place-items-center rounded-full border border-ink-300 text-ink-700 transition-colors duration-150 hover:border-ink-500 disabled:opacity-30"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atEnd}
          aria-label="Article suivant"
          className="grid size-10 place-items-center rounded-full border border-ink-300 text-ink-700 transition-colors duration-150 hover:border-ink-500 disabled:opacity-30"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
