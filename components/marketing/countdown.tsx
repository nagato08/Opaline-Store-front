'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { trackCampaign, type Campaign } from '@/lib/data/campaigns';

/**
 * Opération à durée limitée, avec son décompte.
 *
 * L'échéance vient de la campagne (`endsAt`), jamais d'un compteur qui
 * repart à chaque visite : un faux compte à rebours est la plus vieille
 * ficelle du commerce en ligne, et il se repère en rechargeant la page.
 *
 * Quand l'échéance est passée, la bande disparaît d'elle-même plutôt que
 * d'afficher des zéros — l'API cessera de la servir au prochain chargement,
 * mais un onglet resté ouvert la nuit ne doit pas annoncer une offre finie.
 */
export function Countdown({ campaign }: { campaign: Campaign }) {
  const [left, setLeft] = useState<Parts | null>(() => remaining(campaign.endsAt));

  useEffect(() => {
    trackCampaign(campaign.id, 'IMPRESSION');
  }, [campaign.id]);

  useEffect(() => {
    if (!campaign.endsAt) return;

    /* Une seconde suffit : rafraîchir plus vite ne change rien à l'affichage
       et réveille le fil principal pour rien. */
    const timer = setInterval(() => setLeft(remaining(campaign.endsAt)), 1000);
    return () => clearInterval(timer);
  }, [campaign.endsAt]);

  if (!left) return null;

  return (
    <section
      aria-labelledby={`campagne-${campaign.id}`}
      className="bg-walnut-900 text-white"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <h2 id={`campagne-${campaign.id}`} className="font-display text-xl font-semibold">
            {campaign.title}
          </h2>
          {campaign.body ? (
            <p className="mt-1 text-sm text-white/70">{campaign.body}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-5">
          {/* Le temps restant est aussi écrit en toutes lettres : les quatre
              nombres isolés ne disent rien à qui ne les voit pas défiler. */}
          <p className="sr-only" aria-live="off">
            Il reste {left.days} jours, {left.hours} heures et {left.minutes} minutes.
          </p>

          <ul aria-hidden className="flex items-center gap-2">
            {[
              { value: left.days, unit: 'j' },
              { value: left.hours, unit: 'h' },
              { value: left.minutes, unit: 'min' },
              { value: left.seconds, unit: 's' },
            ].map((part) => (
              <li
                key={part.unit}
                className="min-w-14 bg-white/10 px-2 py-2 text-center"
              >
                <span data-numeric className="block font-mono text-lg leading-none font-semibold">
                  {String(part.value).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-[11px] text-white/60">{part.unit}</span>
              </li>
            ))}
          </ul>

          {campaign.ctaUrl ? (
            <Link
              href={campaign.ctaUrl}
              onClick={() => trackCampaign(campaign.id, 'CLICK')}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-white px-5 text-[15px] font-medium text-walnut-900 transition-colors duration-150 hover:bg-walnut-100"
            >
              {campaign.ctaLabel ?? 'En profiter'}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type Parts = { days: number; hours: number; minutes: number; seconds: number };

/** Temps restant, ou `null` si l'échéance manque ou est passée. */
function remaining(endsAt: string | null): Parts | null {
  if (!endsAt) return null;

  const gap = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(gap) || gap <= 0) return null;

  const seconds = Math.floor(gap / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}
