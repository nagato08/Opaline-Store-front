'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { Category } from '@/lib/data/catalog';

/** Liens simples, sans sous-rayons. */
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
      {/* Bandeau d'annonce : le safran ne sert qu'à ça, jamais à un statut. */}
      <div className="bg-saffron-soft text-center text-sm text-saffron">
        <p className="mx-auto max-w-7xl px-4 py-2.5">
          Livraison offerte dès 60&nbsp;€ en France métropolitaine
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 lg:px-8">
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

          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-ink-900"
          >
            {storeName}
          </Link>

          <nav ref={navRef} aria-label="Rayons" className="ml-6 hidden lg:block">
            <ul className="flex items-center gap-1">
              {categories.map((department) => {
                const expanded = openDept === department.slug;

                return (
                  <li
                    key={department.slug}
                    className="relative"
                    onMouseEnter={() => open(department.slug)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`mega-${department.slug}`}
                      onFocus={() => open(department.slug)}
                      onClick={() => setOpenDept(expanded ? null : department.slug)}
                      className={cn(
                        'flex items-center gap-1 rounded-control px-3 py-2 text-[15px] transition-colors duration-150',
                        expanded
                          ? 'bg-ink-100 text-ink-900'
                          : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                      )}
                    >
                      {department.name}
                      <ChevronDown
                        aria-hidden
                        className={cn('size-3.5 transition-transform duration-150', expanded && 'rotate-180')}
                      />
                    </button>

                    {expanded ? (
                      <div
                        id={`mega-${department.slug}`}
                        className="animate-rise absolute top-[calc(100%+0.5rem)] left-0 z-50 flex w-96 overflow-hidden rounded-card bg-surface shadow-lift ring-1 ring-ink-200/70"
                      >
                        <div className="min-w-0 flex-1 p-4">
                          {department.children.length > 0 ? (
                            <ul>
                              {department.children.map((subcategory) => (
                                <li key={subcategory.slug}>
                                  <Link
                                    href={`/rayons/${department.slug}?rayon=${subcategory.slug}`}
                                    className="block rounded-control px-3 py-2 text-sm text-ink-700 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900"
                                  >
                                    {subcategory.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <Link
                            href={`/rayons/${department.slug}`}
                            className="mt-1 block rounded-control px-3 py-2 text-sm font-medium text-cobalt-600 transition-colors duration-150 hover:bg-cobalt-50"
                          >
                            Tout le rayon {department.name.toLowerCase()}
                          </Link>
                        </div>

                        {department.imageUrl ? (
                          <Link
                            href={`/rayons/${department.slug}`}
                            className="group relative hidden w-32 shrink-0 sm:block"
                          >
                            <Image
                              src={department.imageUrl}
                              alt=""
                              fill
                              sizes="128px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </Link>
                        ) : null}
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
                      'rounded-control px-3 py-2 text-[15px] transition-colors duration-150',
                      item.accent
                        ? 'font-medium text-saffron hover:bg-saffron-soft'
                        : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/recherche"
              aria-label="Rechercher"
              className="grid size-11 place-items-center rounded-control text-ink-700 transition-colors duration-150 hover:bg-ink-100"
            >
              <Search aria-hidden className="size-5" />
            </Link>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Mes favoris"
              className="hidden sm:inline-flex"
            >
              <Heart aria-hidden className="size-5" />
            </Button>

            <Link
              href="/compte/connexion"
              aria-label="Mon compte"
              className="grid size-11 place-items-center rounded-control text-ink-700 transition-colors duration-150 hover:bg-ink-100"
            >
              <User aria-hidden className="size-5" />
            </Link>

            <Link
              href="/panier"
              // Le libellé porte le compte : un lecteur d'écran doit entendre
              // « Panier, 2 articles », pas « Panier » puis un chiffre orphelin.
              aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
              className="relative inline-flex size-11 items-center justify-center rounded-control text-ink-700 transition-colors duration-150 hover:bg-ink-100"
            >
              <ShoppingBag aria-hidden className="size-5" />
              {cartCount > 0 ? (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 grid min-w-4.5 place-items-center rounded-full bg-cobalt-500 px-1 font-mono text-[11px] leading-4 font-medium text-white"
                >
                  {cartCount}
                </span>
              ) : null}
            </Link>
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
                        className="block rounded-control px-3 py-2.5 text-sm font-medium text-cobalt-600"
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
                      ? 'font-medium text-saffron hover:bg-saffron-soft'
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
