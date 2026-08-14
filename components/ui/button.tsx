'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Styles partagés par le bouton et le lien-bouton.
 *
 * Un lien qui navigue doit rester un `<a>` : imbriquer un `<Link>` dans un
 * `<button>` produit du HTML invalide, casse l'ouverture dans un nouvel onglet
 * et fait annoncer deux éléments interactifs par les lecteurs d'écran. D'où
 * deux composants distincts qui partagent la même apparence.
 */
const variants = {
  primary: 'bg-cobalt-500 text-white hover:bg-cobalt-600 active:bg-cobalt-700',
  secondary:
    'bg-surface text-ink-900 ring-1 ring-inset ring-ink-300 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-700 hover:bg-ink-100 active:bg-ink-200',
  quiet: 'text-ink-600 underline underline-offset-4 hover:text-ink-900',
} as const;

const sizes = {
  // 48 px sur la boutique contre 44 en back-office : on achète souvent au
  // pouce, dans les transports, et la cible doit pardonner l'imprécision.
  lg: 'h-12 px-6 text-base gap-2',
  md: 'h-11 px-5 text-[15px] gap-2',
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  icon: 'size-11 justify-center',
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

function styles(variant: Variant, size: Size, className?: string): string {
  return cn(
    'inline-flex items-center justify-center rounded-control font-medium',
    // `manipulation` supprime le délai de 300 ms au tap sur mobile.
    'touch-manipulation transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

/**
 * Bouton d'action.
 *
 * Une seule action principale par écran : `primary` est la seule variante à
 * porter le cobalt plein. Sur une fiche produit, c'est « Ajouter au panier ».
 *
 * Le bouton **reste actif** pendant une requête et affiche un indicateur : le
 * désactiver fait perdre le focus clavier et laisse croire à un blocage.
 */
export const Button = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
  }
>(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={styles(variant, size, className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
});

/** Lien ayant l'apparence d'un bouton. Navigue, donc reste un `<a>`. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link className={styles(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
