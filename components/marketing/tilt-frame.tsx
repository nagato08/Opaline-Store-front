'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Cadre qui s'incline légèrement vers le pointeur.
 *
 * Donne une épaisseur à l'image d'accroche sans rien ajouter à la page : la
 * photo réagit au geste, ce qui suffit à la faire exister comme objet plutôt
 * que comme fond.
 *
 * L'inclinaison est volontairement faible — quatre degrés au maximum. Au-delà,
 * la perspective déforme le produit photographié, et une boutique qui déforme
 * ce qu'elle vend ment sur la marchandise.
 *
 * Les angles passent par des variables CSS écrites directement sur le nœud,
 * jamais par un état React : un `setState` à chaque déplacement de souris
 * relancerait le rendu soixante fois par seconde pour deux nombres que seul
 * le compositeur utilise.
 */
const MAX_DEGREES = 4;

export function TiltFrame({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);

  function track(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;

    const element = frame.current;
    const box = element?.getBoundingClientRect();
    if (!element || !box) return;

    /* Écart au centre, ramené entre -1 et 1. L'axe X s'inverse : déplacer la
       souris vers le haut doit faire basculer le haut de l'image vers
       l'arrière, comme un objet posé qu'on regarde de plus haut. */
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    element.style.setProperty('--tilt-y', `${x * MAX_DEGREES * 2}deg`);
    element.style.setProperty('--tilt-x', `${-y * MAX_DEGREES * 2}deg`);
  }

  function release() {
    const element = frame.current;
    if (!element) return;

    element.style.setProperty('--tilt-y', '0deg');
    element.style.setProperty('--tilt-x', '0deg');
  }

  return (
    <div
      ref={frame}
      onPointerMove={track}
      onPointerLeave={release}
      className="tilt will-change-transform"
    >
      {children}
    </div>
  );
}
