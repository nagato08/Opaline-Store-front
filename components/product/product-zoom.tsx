'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';

/**
 * Photo principale d'une fiche, avec loupe au survol.
 *
 * Sur du mobilier ou du textile, la matière décide de l'achat : le grain du
 * velours, la finition d'un pied, la trame d'un tissu. Une photo cadrée large
 * ne les montre pas, et le client qui veut regarder de près n'a aujourd'hui
 * aucun moyen de le faire sans quitter la page.
 *
 * L'agrandissement se fait par `transform` sur l'image déjà chargée en
 * résolution `zoom` (1600 px) : aucun octet supplémentaire, aucune requête, et
 * le déplacement suit le pointeur sur le fil de composition.
 *
 * Réservé au pointeur fin. Au doigt, un survol n'existe pas et un
 * agrandissement qui suit le toucher empêcherait de faire défiler la page —
 * c'est pour cela que l'effet ne s'arme que sur `mouse`.
 */
export function ProductZoom({ src, alt }: { src: string; alt: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  function track(event: React.MouseEvent<HTMLDivElement>) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;

    /* Le point survolé devient le centre de l'agrandissement : la zone
       regardée reste sous le curseur au lieu de fuir sur le côté. */
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div
      ref={frame}
      onPointerEnter={(event) => {
        /* Seul le pointeur fin arme la loupe : au doigt, l'agrandissement
           suivrait le geste de défilement et bloquerait la lecture. */
        if (event.pointerType === 'mouse') setZoomed(true);
      }}
      onMouseMove={track}
      onPointerLeave={() => setZoomed(false)}
      className="group/zoom size-full"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 45vw, 100vw"
        priority
        style={{ transformOrigin: origin }}
        className={
          zoomed
            ? 'scale-[1.9] object-cover transition-transform duration-300 ease-out motion-reduce:scale-100'
            : 'object-cover transition-transform duration-300 ease-out'
        }
      />

      {/* Indice discret : sans lui, personne ne devine qu'il y a quelque chose
          à regarder de plus près. Il s'efface dès que la loupe est active. */}
      <span
        aria-hidden
        className={
          zoomed
            ? 'pointer-events-none absolute right-3 bottom-3 rounded-full bg-ink-900/70 p-2 opacity-0 transition-opacity duration-150'
            : 'pointer-events-none absolute right-3 bottom-3 rounded-full bg-ink-900/70 p-2 opacity-100 transition-opacity duration-150'
        }
      >
        <ZoomIn className="size-4 text-white" />
      </span>
    </div>
  );
}
