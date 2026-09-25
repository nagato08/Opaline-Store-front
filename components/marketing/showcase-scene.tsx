'use client';

import { useEffect, useRef } from 'react';

/**
 * Objets en lévitation, rendus en WebGL.
 *
 * Une grappe de volumes primitifs — cube, sphère, cylindre, tore — en verre
 * teinté, qui tournent lentement et s'inclinent vers le pointeur. Rien n'y
 * représente un produit du catalogue : ce sont des objets sans identité, et
 * c'est voulu. Une boutique qui vend à la fois un canapé, un ordinateur et un
 * pot de miel n'a pas de produit emblématique ; lui en inventer un mentirait
 * sur l'assortiment.
 *
 * Trois précautions de coût, parce qu'une vitrine ne doit jamais retarder un
 * achat :
 *
 * 1. `three` est importé dynamiquement, donc absent du fardeau initial.
 * 2. La boucle ne tourne que lorsque le canevas est à l'écran.
 * 3. `prefers-reduced-motion` rend une seule image et s'arrête là — la scène
 *    reste belle, elle ne bouge plus.
 *
 * Le module entier échoue en silence : sur un appareil sans WebGL, le dégradé
 * posé derrière suffit à tenir la composition.
 */
export function ShowcaseScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;

    /* Rien sous 1024 px, et le module n'est même pas téléchargé.
       Sur un téléphone, le titre occupe tout le haut et la photo tout le bas :
       il n'existe aucune zone où poser un volume sans couvrir du texte. Plutôt
       qu'une scène cachée derrière une image opaque, on économise cent
       cinquante kilo-octets et la batterie ; le halo coloré tient la
       composition seul. */
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    let stop = () => {};
    let cancelled = false;

    void (async () => {
      const THREE = await import('three');
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
      if (cancelled || !mount) return;

      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      /* Plafonné à 2 : au-delà, on quadruple le nombre de pixels calculés pour
         une différence que l'œil ne voit pas sur une scène floue. */
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      /* Le verre n'existe que par ce qu'il reflète : sans environnement, les
         volumes sortent gris et plats. `RoomEnvironment` en fournit un généré
         à la volée, sans fichier à télécharger. */
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const camera = new THREE.PerspectiveCamera(
        42,
        mount.clientWidth / mount.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0, 9);

      /* Les deux couleurs de la boutique, en lumière plutôt qu'en aplat :
         cobalt d'un côté, safran de l'autre, pour que chaque volume porte les
         deux tons sur ses arêtes. */
      const cobalt = new THREE.PointLight(0x2b4eff, 220, 40);
      cobalt.position.set(-6, 4, 6);
      scene.add(cobalt);

      const saffron = new THREE.PointLight(0xc2410c, 160, 40);
      saffron.position.set(6, -3, 4);
      scene.add(saffron);

      scene.add(new THREE.AmbientLight(0xffffff, 0.35));

      /* Métal poli irisé plutôt que verre transparent. La transmission
         demande un rendu en plusieurs passes, que les machines sans carte
         graphique dédiée rendent gris et plat ; un métal capte les deux
         lumières colorées en une seule passe, et c'est justement ce reflet
         bleu-orangé qu'on cherche. */
      const polished = (tint: number) =>
        new THREE.MeshPhysicalMaterial({
          color: tint,
          metalness: 0.95,
          roughness: 0.18,
          iridescence: 0.85,
          iridescenceIOR: 1.6,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
        });

      const shapes: Array<{
        mesh: import('three').Mesh;
        spin: number;
        drift: number;
        phase: number;
      }> = [];

      /* Les volumes encadrent la photo du produit et laissent la colonne de
         gauche au titre : un objet qui passe derrière une lettre la rend
         illisible quel que soit le contraste du texte. */
      const blueprint: Array<
        [import('three').BufferGeometry, number, [number, number, number]]
      > = [
        [new THREE.IcosahedronGeometry(0.85, 0), 0xdfe6ff, [-4.6, 3.1, -4.5]],
        [new THREE.TorusGeometry(0.72, 0.23, 24, 64), 0xffd9b8, [2.1, -3.2, -3.6]],
        [new THREE.BoxGeometry(1.0, 1.0, 1.0, 2, 2, 2), 0xc9d6ff, [5.2, 3.0, -3.2]],
        [new THREE.SphereGeometry(0.62, 40, 40), 0xf0f3ff, [6.9, -1.4, -3.4]],
        [new THREE.CylinderGeometry(0.4, 0.4, 1.1, 40), 0xffc79a, [3.6, 2.2, -5.0]],
      ];

      for (const [geometry, tint, position] of blueprint) {
        const mesh = new THREE.Mesh(geometry, polished(tint));
        mesh.position.set(...position);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        scene.add(mesh);
        shapes.push({
          mesh,
          spin: 0.08 + Math.random() * 0.12,
          drift: 0.18 + Math.random() * 0.22,
          phase: Math.random() * Math.PI * 2,
        });
      }

      /* Cible d'inclinaison écrite par la souris, rejointe progressivement :
         suivre le pointeur au pixel près donnerait une scène nerveuse. */
      const aim = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        aim.x = (event.clientX / window.innerWidth - 0.5) * 0.5;
        aim.y = (event.clientY / window.innerHeight - 0.5) * 0.35;
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      const clock = new THREE.Clock();
      let frame = 0;
      let visible = true;

      const draw = () => {
        const time = clock.getElapsedTime();

        for (const shape of shapes) {
          shape.mesh.rotation.x += shape.spin * 0.01;
          shape.mesh.rotation.y += shape.spin * 0.013;
          shape.mesh.position.y += Math.sin(time * shape.drift + shape.phase) * 0.0016;
        }

        scene.rotation.y += (aim.x - scene.rotation.y) * 0.04;
        scene.rotation.x += (-aim.y - scene.rotation.x) * 0.04;

        renderer.render(scene, camera);
        if (visible) frame = requestAnimationFrame(draw);
      };

      if (still) {
        renderer.render(scene, camera);
      } else {
        /* Hors écran, la scène ne consomme rien : sur une page longue, la
           laisser tourner sous le pied de page chaufferait le téléphone pour
           une image que personne ne regarde. */
        const watcher = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) draw();
          else cancelAnimationFrame(frame);
        });
        watcher.observe(mount);

        const previousStop = stop;
        stop = () => {
          previousStop();
          watcher.disconnect();
        };
      }

      const onResize = () => {
        if (!mount.clientWidth) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        if (still) renderer.render(scene, camera);
      };

      const sizeWatcher = new ResizeObserver(onResize);
      sizeWatcher.observe(mount);

      const previous = stop;
      stop = () => {
        previous();
        cancelAnimationFrame(frame);
        sizeWatcher.disconnect();
        window.removeEventListener('pointermove', onPointer);

        /* La mémoire GPU n'est pas ramassée par le moteur JavaScript : sans
           ces libérations, chaque navigation vers l'accueil laisserait une
           scène complète derrière elle. */
        for (const shape of shapes) {
          shape.mesh.geometry.dispose();
          (shape.mesh.material as import('three').Material).dispose();
        }
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      className="absolute inset-0 [&>canvas]:size-full [&>canvas]:touch-none"
    />
  );
}
