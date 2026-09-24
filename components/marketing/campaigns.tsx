'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { listCampaigns, trackCampaign, type Campaign } from '@/lib/data/campaigns';

/**
 * Affichage des campagnes programmées depuis le back-office.
 *
 * Le serveur a déjà tranché l'éligibilité — planning, ciblage, plafond par
 * visiteur. Il reste à ce composant une seule responsabilité : décider **quand**
 * montrer ce qu'on lui a donné, en suivant `displayRules`.
 *
 * L'appel se fait depuis le navigateur et non au rendu serveur, parce que le
 * ciblage dépend de l'appareil et de l'identifiant de visiteur, dont le serveur
 * ne dispose pas.
 */
export function Campaigns() {
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    let cancelled = false;

    listCampaigns(pathname).then((found) => {
      if (!cancelled) setCampaigns(found);
    });

    /* Les campagnes dépendent du chemin : changer de page rejoue la
       résolution, et écarte celles qui ne visaient que la précédente. */
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const bar = campaigns.find((campaign) => campaign.type === 'TOP_BAR');
  const popup = campaigns.find(
    (campaign) => campaign.type === 'POPUP' || campaign.type === 'INTERSTITIAL',
  );

  return (
    <>
      {bar ? <TopBar key={bar.id} campaign={bar} /> : null}
      {popup ? <Popup key={popup.id} campaign={popup} /> : null}
    </>
  );
}

/** Barre haute : toujours immédiate, c'est le propre d'une annonce permanente. */
function TopBar({ campaign }: { campaign: Campaign }) {
  const [closed, setClosed] = useState(false);
  const rules = campaign.displayRules ?? {};

  useEffect(() => {
    trackCampaign(campaign.id, 'IMPRESSION');
  }, [campaign.id]);

  if (closed) return null;

  return (
    <div className="bg-saffron-soft">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5 lg:px-8">
        <p className="text-center text-sm text-saffron">
          {campaign.title}
          {campaign.ctaUrl ? (
            <>
              {' '}
              <Link
                href={campaign.ctaUrl}
                onClick={() => trackCampaign(campaign.id, 'CLICK')}
                className="font-medium underline underline-offset-2"
              >
                {campaign.ctaLabel ?? 'En savoir plus'}
              </Link>
            </>
          ) : null}
        </p>

        {rules.dismissible ? (
          <button
            type="button"
            onClick={() => {
              trackCampaign(campaign.id, 'DISMISS');
              setClosed(true);
            }}
            aria-label="Masquer ce message"
            className="shrink-0 rounded-full p-1 text-saffron hover:bg-saffron/10"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Fenêtre modale.
 *
 * Bâtie sur `<dialog>` ouvert par `showModal()` : le navigateur fournit alors
 * le piégeage du focus, la fermeture par Échap et l'inertie de l'arrière-plan,
 * que toute réimplémentation manuelle rate.
 */
function Popup({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const rules = campaign.displayRules ?? {};

  /* Le déclencheur décide du moment. Les trois formes se ramènent à un même
     geste : armer un écouteur, ouvrir une fois, se désarmer. */
  useEffect(() => {
    const trigger = rules.trigger ?? 'IMMEDIATE';
    let timer: ReturnType<typeof setTimeout> | undefined;

    function show() {
      setOpen(true);
      trackCampaign(campaign.id, 'IMPRESSION');
    }

    if (trigger === 'IMMEDIATE') {
      show();
      return;
    }

    if (trigger === 'DELAY') {
      timer = setTimeout(show, rules.delayMs ?? 10000);
      return () => clearTimeout(timer);
    }

    if (trigger === 'SCROLL') {
      const target = rules.scrollPercent ?? 50;

      const onScroll = () => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        if (height <= 0) return;
        if ((window.scrollY / height) * 100 >= target) {
          show();
          window.removeEventListener('scroll', onScroll);
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    /* Intention de sortie : le curseur qui franchit le haut de la fenêtre.
       Sans équivalent au doigt, ce déclencheur ne se produit jamais sur
       mobile — c'est une limite du signal, pas un oubli. */
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) {
        show();
        document.removeEventListener('mouseout', onLeave);
      }
    };

    document.addEventListener('mouseout', onLeave);
    return () => document.removeEventListener('mouseout', onLeave);
  }, [campaign.id, rules.trigger, rules.delayMs, rules.scrollPercent]);

  function close() {
    trackCampaign(campaign.id, 'DISMISS');
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`campagne-${campaign.id}`}
        className="w-full max-w-md rounded-card bg-white p-6 shadow-pop"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={`campagne-${campaign.id}`} className="text-xl font-bold text-ink-900">
            {campaign.title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        {campaign.body ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{campaign.body}</p>
        ) : null}

        {campaign.promotionCode ? (
          <p className="mt-4 rounded-xl bg-clay-50 px-4 py-3 text-center">
            <span className="font-mono text-lg font-semibold text-ink-900">
              {campaign.promotionCode}
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {campaign.ctaUrl ? (
            <Link
              href={campaign.ctaUrl}
              onClick={() => {
                trackCampaign(campaign.id, 'CLICK');
                setOpen(false);
              }}
              className="inline-flex h-11 items-center rounded-xl bg-cobalt-500 px-5 font-medium text-white transition-colors duration-150 hover:bg-cobalt-600"
            >
              {campaign.ctaLabel ?? 'Découvrir'}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center rounded-xl px-5 font-medium text-ink-700 hover:bg-ink-50"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
