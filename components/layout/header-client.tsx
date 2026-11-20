'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { Category } from '@/lib/data/catalog';

/**
 * Liens simples, sans sous-rayons.
 *
 * `accent` ne pose plus qu'une graisse : le safran est la couleur du prix
 * réduit, et l'étendre à un lien de navigation le rendait illisible comme
 * signal — quatre rôles pour une seule teinte, elle n'en portait plus aucun.
 */
const plainLinks = [
  { href: '/nouveautes', label: 'Nouveautés' },
  { href: '/promotions', label: 'Promotions', accent: true },
];

export function HeaderClient({
  categories,
  cartCount = 0,
  storeName,
}: {
  categories: Category[];
  cartCount?: number;
  /** Enseigne du client, lue dans les réglages : jamais une constante ici. */
  storeName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDept, setOpenDept] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open(slug: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDept(slug);
  }

  /** Petit délai : sans lui, traverser l'espace entre le déclencheur et le
      panneau referme le menu avant d'y arriver. */
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenDept(null), 150);
  }

  useEffect(() => {
    if (!openDept) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenDept(null);
    }

    // Sortir du sous-menu au clavier (Tab au-delà du dernier lien) le ferme
    // aussi bien qu'un clic ailleurs.
    function onFocusOut(event: FocusEvent) {
      if (!navRef.current?.contains(event.relatedTarget as Node)) setOpenDept(null);
    }

    const nav = navRef.current;
    document.addEventListener('keydown', onKeyDown);
    nav?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      nav?.removeEventListener('focusout', onFocusOut);
    };
  }, [openDept]);

  // Tiroir mobile porté par `<dialog>` : le focus reste piégé à l'intérieur,
  // Échap ferme, et le focus revient au bouton d'ouverture — trois
  // comportements qu'un `<div>` en position fixe n'offre jamais gratuitement.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  return (
    <>
      {/* Le bandeau d'annonce vient des campagnes, pas du code : il se règle
          depuis le back-office, avec ses dates et son ciblage. Il vit dans la
          mise en page racine — voir `components/marketing/campaigns.tsx`. */}

      <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-sm">
        {/* Rangée haute : l'enseigne, la recherche, le compte.
            L'enseigne est écrite, pas mise dans une pastille : un carré
            coloré à coin arrondi avec un pictogramme dedans est le logo par
            défaut de tous les gabarits, et il ne dit rien du commerce.

            La recherche occupe le centre parce que c'est le geste le plus
            fréquent d'un catalogue qu'on ne connaît pas par cœur ; reléguée
            derrière une loupe, elle demandait un clic pour exister. */}
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-2 px-4 sm:gap-4 lg:gap-5 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden className="size-5" />
          </Button>

          <Link
            href="/"
            className="shrink-0 font-display text-xl leading-none font-bold tracking-[-0.045em] text-ink-900 sm:text-[1.6rem]"
          >
            {storeName}
            <span aria-hidden className="text-walnut-500">
              .
            </span>
          </Link>

          {/* `action` en GET : la recherche reste une URL partageable, et le
              formulaire fonctionne avant même que React soit hydraté.

              Un filet sous le champ au lieu d'une gélule encadrée : le champ
              se lit comme une ligne d'écriture, pas comme un bouton. */}
          <form
            action="/recherche"
            role="search"
            className="mx-auto hidden w-full max-w-md md:block"
          >
            <label htmlFor="recherche-entete" className="sr-only">
              Rechercher un produit
            </label>
            <div className="flex h-10 items-center gap-2 border-b border-ink-300 transition-colors duration-150 focus-within:border-ink-900">
              <Search aria-hidden className="size-4 shrink-0 text-ink-400" />
              <input
                id="recherche-entete"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="Rechercher un produit, une marque…"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 font-mono text-[11px] tracking-[0.16em] text-ink-500 uppercase transition-colors duration-150 hover:text-ink-900"
              >
                Chercher
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-1.5">
            <Link
              href="/recherche"
              aria-label="Rechercher"
              className="grid size-10 place-items-center text-ink-700 transition-colors duration-150 hover:text-ink-900 md:hidden"
            >
              <Search aria-hidden className="size-5" />
            </Link>

            <HeaderAction href="/compte/connexion" label="Compte">
              <User aria-hidden className="size-[18px]" />
            </HeaderAction>

            <HeaderAction href="/favoris" label="Favoris" className="hidden sm:flex">
              <Heart aria-hidden className="size-[18px]" />
            </HeaderAction>

            {/* Région vivante : un `aria-label` ne se réannonce pas quand il
                change, si bien qu'un ajout au panier restait muet. Le badge
                reste décoratif, ce texte porte l'annonce. */}
            <span aria-live="polite" className="sr-only">
              {cartCount === 0
                ? 'Panier vide'
                : `Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
            </span>

            <HeaderAction
              href="/panier"
              label="Panier"
              // Le libellé porte le compte : un lecteur d'écran doit entendre
              // « Panier, 2 articles », pas « Panier » puis un chiffre orphelin.
              describedAs={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
            >
              <ShoppingBag aria-hidden className="size-[18px]" />
              <span
                aria-hidden
                className={cn(
                  'absolute -top-1.5 -right-2.5 min-w-4 px-1 text-center font-mono text-[10px] leading-4 font-medium',
                  cartCount > 0 ? 'bg-walnut-500 text-white' : 'text-ink-400',
                )}
              >
                {cartCount}
              </span>
            </HeaderAction>
          </div>
        </div>

        {/* Rangée basse : les rayons.
            Séparée de l'enseigne parce qu'elle change de rôle — la première
            rangée sert à s'orienter dans le site, celle-ci à entrer dans le
            catalogue. Les capitales en chasse fixe la distinguent sans y
            poser un second fond : un bandeau teinté sous l'en-tête empile
            deux barres et mange le haut de la page. */}
        <div className="border-y border-ink-900/12">
          <div className="mx-auto flex h-11 max-w-7xl items-center gap-5 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex shrink-0 items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink-700 uppercase transition-colors duration-150 hover:text-ink-900"
            >
              <Menu aria-hidden className="size-3.5" />
              Catégories
            </button>

            <nav ref={navRef} aria-label="Rayons" className="hidden min-w-0 lg:block">
              <ul className="flex items-center gap-6">
                {categories.map((department) => {
                  const expanded = openDept === department.slug;

                  return (
                    <li
                      key={department.slug}
                      className="relative"
                      onMouseEnter={() => open(department.slug)}
                      onMouseLeave={scheduleClose}
                    >
                      <Link
                        href={`/rayons/${department.slug}`}
                        aria-expanded={expanded}
                        onFocus={() => open(department.slug)}
                        className="flex h-11 items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] whitespace-nowrap text-ink-700 uppercase transition-colors duration-150 hover:text-ink-900"
                      >
                        {department.name}
                        {department.children.length > 0 ? (
                          <ChevronDown
                            aria-hidden
                            className={cn(
                              'size-3 text-ink-400 transition-transform duration-150',
                              expanded && 'rotate-180',
                            )}
                          />
                        ) : null}
                      </Link>

                      {expanded && department.children.length > 0 ? (
                        <div className="absolute top-full left-0 z-10 w-60 border border-ink-900/12 bg-surface p-1.5 shadow-lift">
                          <ul>
                            {department.children.map((subcategory) => (
                              <li key={subcategory.slug}>
                                <Link
                                  href={`/rayons/${department.slug}?rayon=${subcategory.slug}`}
                                  className="block px-3 py-2 text-sm text-ink-700 transition-colors duration-150 hover:bg-walnut-50 hover:text-ink-900"
                                >
                                  {subcategory.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}

                {plainLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'font-mono text-[11px] tracking-[0.16em] whitespace-nowrap uppercase transition-colors duration-150 hover:text-ink-900',
                        item.accent ? 'text-walnut-600' : 'text-ink-700',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}

                <li>
                  <Link
                    href="/contact"
                    className="font-mono text-[11px] tracking-[0.16em] whitespace-nowrap text-ink-700 uppercase transition-colors duration-150 hover:text-ink-900"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <p className="ml-auto hidden font-mono text-[11px] tracking-[0.16em] text-ink-500 uppercase lg:block">
              Livraison offerte dès 60 €
            </p>
          </div>
        </div>
      </header>

      <dialog
        ref={dialogRef}
        aria-label="Menu de navigation"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setMenuOpen(false);
        }}
        className="m-0 h-dvh max-h-none w-80 max-w-[85vw] bg-transparent p-0 backdrop:bg-ink-900/50 lg:hidden"
      >
        <div className="animate-rise h-full overflow-y-auto overscroll-contain bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.18em] text-ink-500 uppercase">
              Rayons
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fermer le menu"
              onClick={() => setMenuOpen(false)}
            >
              <X aria-hidden className="size-5" />
            </Button>
          </div>

          <ul className="mt-4 border-t border-ink-900/12">
            {categories.map((department) => (
              <li key={department.slug} className="border-b border-ink-900/12">
                {/* `<details>` natif : disclosure accessible sans JavaScript
                    supplémentaire, avec son propre état clavier déjà géré par
                    le navigateur. */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-display text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                    {department.name}
                    <ChevronDown
                      aria-hidden
                      className="size-4 text-ink-400 transition-transform duration-150 group-open:rotate-180"
                    />
                  </summary>
                  <ul className="mb-3 ml-1 space-y-0.5 border-l border-ink-200 pl-4">
                    {department.children.map((subcategory) => (
                      <li key={subcategory.slug}>
                        <Link
                          href={`/rayons/${department.slug}?rayon=${subcategory.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="block py-2.5 text-sm text-ink-600 transition-colors duration-150 hover:text-ink-900"
                        >
                          {subcategory.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={`/rayons/${department.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="block py-2.5 text-sm font-medium text-walnut-600"
                      >
                        Tout le rayon
                      </Link>
                    </li>
                  </ul>
                </details>
              </li>
            ))}

            {plainLinks.map((item) => (
              <li key={item.href} className="border-b border-ink-900/12">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block py-3.5 font-display text-lg font-semibold transition-colors duration-150',
                    item.accent ? 'text-walnut-600' : 'text-ink-900',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

/**
 * Action de l'en-tête : une icône, son libellé dessous.
 *
 * Le libellé écrit évite la devinette d'un pictogramme seul — un cœur peut
 * aussi bien dire « favoris » que « j'aime » — et il donne à la cible tactile
 * la hauteur nécessaire sans gonfler l'icône.
 */
function HeaderAction({
  href,
  label,
  describedAs,
  className,
  children,
}: {
  href: string;
  label: string;
  /** Remplace le libellé lu, quand il doit porter plus que le mot affiché. */
  describedAs?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={describedAs}
      className={cn(
        'flex flex-col items-center gap-1 px-1.5 py-1.5 text-ink-700 transition-colors duration-150 hover:text-ink-900 sm:px-2.5',
        className,
      )}
    >
      <span className="relative grid place-items-center">{children}</span>
      <span
        aria-hidden
        className="font-mono text-[10px] leading-none tracking-[0.1em] uppercase"
      >
        {label}
      </span>
    </Link>
  );
}
