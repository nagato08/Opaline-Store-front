'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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

      <header className="sticky top-0 z-40 bg-surface">
        {/* Rangée haute : l'enseigne, la recherche, le compte.
            La recherche occupe le centre parce que c'est le geste le plus
            fréquent d'un catalogue qu'on ne connaît pas par cœur ; reléguée
            derrière une loupe, elle demandait un clic pour exister. */}
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden className="size-5" />
          </Button>

          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-xl bg-walnut-500 text-white"
            >
              <ShoppingBag className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-xl font-bold tracking-tight text-ink-900">
                {storeName}
              </span>
              <span className="hidden text-xs text-ink-500 sm:block">
                Tout ce dont vous avez besoin
              </span>
            </span>
          </Link>

          {/* `action` en GET : la recherche reste une URL partageable, et le
              formulaire fonctionne avant même que React soit hydraté. */}
          <form
            action="/recherche"
            role="search"
            className="mx-auto hidden w-full max-w-xl md:block"
          >
            <label htmlFor="recherche-entete" className="sr-only">
              Rechercher un produit
            </label>
            <div className="flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-surface pr-1.5 pl-5 transition-colors duration-150 focus-within:border-walnut-400">
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
                aria-label="Lancer la recherche"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-walnut-500 text-white transition-colors duration-150 hover:bg-walnut-600"
              >
                <Search aria-hidden className="size-4" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
            <Link
              href="/recherche"
              aria-label="Rechercher"
              className="grid size-11 place-items-center rounded-control text-ink-700 transition-colors duration-150 hover:bg-ink-100 md:hidden"
            >
              <Search aria-hidden className="size-5" />
            </Link>

            <HeaderAction href="/compte/connexion" label="Compte">
              <User aria-hidden className="size-5" />
            </HeaderAction>

            <HeaderAction href="/favoris" label="Favoris" className="hidden sm:flex">
              <Heart aria-hidden className="size-5" />
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
              <ShoppingBag aria-hidden className="size-5" />
              <span
                aria-hidden
                className={cn(
                  'absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full px-1 font-mono text-[11px] leading-5 font-medium',
                  cartCount > 0 ? 'bg-walnut-500 text-white' : 'bg-ink-200 text-ink-600',
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
            catalogue. Le fond l'en distingue sans trait de séparation. */}
        <div className="border-y border-ink-200/70 bg-walnut-50/60">
          <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-control py-1.5 pr-3 text-sm font-medium text-ink-800 transition-colors duration-150 hover:text-walnut-600 lg:pl-1"
            >
              <Menu aria-hidden className="size-4" />
              Toutes les catégories
            </button>

            <nav ref={navRef} aria-label="Rayons" className="hidden min-w-0 lg:block">
              <ul className="flex items-center">
                <li>
                  <Link
                    href="/"
                    className="rounded-control px-3 py-2 text-sm font-medium text-walnut-600"
                  >
                    Accueil
                  </Link>
                </li>

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
                        className="flex items-center gap-1 rounded-control px-3 py-2 text-sm whitespace-nowrap text-ink-700 transition-colors duration-150 hover:text-walnut-600"
                      >
                        {department.name}
                        {department.children.length > 0 ? (
                          <ChevronDown
                            aria-hidden
                            className={cn(
                              'size-3.5 text-ink-400 transition-transform duration-150',
                              expanded && 'rotate-180',
                            )}
                          />
                        ) : null}
                      </Link>

                      {expanded && department.children.length > 0 ? (
                        <div className="absolute top-full left-0 z-10 w-60 rounded-card border border-ink-200 bg-surface p-2 shadow-lift">
                          <ul>
                            {department.children.map((subcategory) => (
                              <li key={subcategory.slug}>
                                <Link
                                  href={`/rayons/${department.slug}?rayon=${subcategory.slug}`}
                                  className="block rounded-control px-3 py-2 text-sm text-ink-700 transition-colors duration-150 hover:bg-walnut-50 hover:text-ink-900"
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
                        'rounded-control px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150 hover:text-walnut-600',
                        item.accent ? 'font-medium text-ink-900' : 'text-ink-700',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}

                <li>
                  <Link
                    href="/contact"
                    className="rounded-control px-3 py-2 text-sm whitespace-nowrap text-ink-700 transition-colors duration-150 hover:text-walnut-600"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
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
            <span className="font-display text-lg font-bold">Rayons</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fermer le menu"
              onClick={() => setMenuOpen(false)}
            >
              <X aria-hidden className="size-5" />
            </Button>
          </div>

          <ul className="mt-4 space-y-1">
            {categories.map((department) => (
              <li key={department.slug}>
                {/* `<details>` natif : disclosure accessible sans JavaScript
                    supplémentaire, avec son propre état clavier déjà géré par
                    le navigateur. */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-control px-3 py-3 text-base text-ink-800 transition-colors duration-150 hover:bg-ink-100 [&::-webkit-details-marker]:hidden">
                    {department.name}
                    <ChevronDown
                      aria-hidden
                      className="size-4 text-ink-400 transition-transform duration-150 group-open:rotate-180"
                    />
                  </summary>
                  <ul className="mt-0.5 mb-1.5 ml-3 space-y-0.5 border-l border-ink-200 pl-3">
                    {department.children.map((subcategory) => (
                      <li key={subcategory.slug}>
                        <Link
                          href={`/rayons/${department.slug}?rayon=${subcategory.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-control px-3 py-2.5 text-sm text-ink-600 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900"
                        >
                          {subcategory.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={`/rayons/${department.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-control px-3 py-2.5 text-sm font-medium text-walnut-600"
                      >
                        Tout le rayon
                      </Link>
                    </li>
                  </ul>
                </details>
              </li>
            ))}

            {plainLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block rounded-control px-3 py-3 text-base transition-colors duration-150',
                    item.accent
                      ? 'font-medium text-ink-900 hover:bg-ink-100'
                      : 'text-ink-800 hover:bg-ink-100',
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
        'flex flex-col items-center gap-0.5 rounded-control px-2.5 py-1.5 text-ink-700 transition-colors duration-150 hover:text-walnut-600',
        className,
      )}
    >
      <span className="relative grid place-items-center">{children}</span>
      <span aria-hidden className="text-[11px] leading-none font-medium">
        {label}
      </span>
    </Link>
  );
}
