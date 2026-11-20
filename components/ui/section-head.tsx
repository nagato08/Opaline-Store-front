import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * En-tête de section, éditorial.
 *
 * Toutes les sections de la boutique partagent la même ouverture : un filet
 * pleine largeur, un numéro de chapitre en chasse fixe, puis le titre en
 * grand. C'est ce qui donne à la page sa cadence — sans ce rythme répété,
 * une suite de grilles se lit comme un seul bloc indifférencié, et le
 * visiteur arrête de descendre.
 *
 * Le numéro n'est pas une décoration : il dit combien de chapitres restent,
 * ce qui est exactement l'information qu'on cherche en faisant défiler.
 */
export function SectionHead({
  index,
  label,
  title,
  lead,
  href,
  linkLabel,
  id,
  tone = 'light',
}: {
  /** Numéro de chapitre, affiché sur deux chiffres. */
  index: number;
  /** Mention courte en capitales : la nature du chapitre. */
  label: string;
  title: string;
  lead?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
  /** `dark` pour les bandes à fond encre ou vert profond. */
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';

  return (
    <div
      className={
        'border-t pt-5 ' + (dark ? 'border-white/20' : 'border-ink-900/15')
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <p
          className={
            'font-mono text-xs tracking-[0.18em] uppercase ' +
            (dark ? 'text-white/50' : 'text-ink-500')
          }
        >
          <span className={dark ? 'text-white/80' : 'text-walnut-600'}>
            {String(index).padStart(2, '0')}
          </span>
          <span aria-hidden className="mx-2.5">
            /
          </span>
          {label}
        </p>

        {href && linkLabel ? (
          <Link
            href={href}
            className={
              'group inline-flex items-center gap-2 text-[15px] font-medium underline-offset-4 hover:underline ' +
              (dark ? 'text-white' : 'text-ink-900')
            }
          >
            {linkLabel}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
        ) : null}
      </div>

      <h2
        id={id}
        className={
          'mt-4 max-w-3xl text-[clamp(2rem,4.4vw,3.5rem)] font-bold ' +
          (dark ? 'text-white' : 'text-ink-900')
        }
      >
        {title}
      </h2>

      {lead ? (
        <p
          className={
            'mt-4 max-w-xl text-[17px] leading-relaxed ' +
            (dark ? 'text-white/65' : 'text-ink-600')
          }
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
