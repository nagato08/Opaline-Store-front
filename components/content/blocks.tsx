import type { ContentBlock } from '@/lib/data/content';

/**
 * Rendu des blocs de contenu éditorial.
 *
 * Le format est ouvert (`Json?` côté API) : seul le type `text` est garanti
 * aujourd'hui. Un type inconnu est ignoré plutôt que de casser la page —
 * un futur type de bloc ne doit pas empêcher d'afficher le reste.
 */
export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="prose-content space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'text' && typeof block.value === 'string') {
          return (
            <p key={index} className="text-[15px] leading-relaxed text-ink-700">
              {block.value}
            </p>
          );
        }
        if (block.type === 'heading' && typeof block.value === 'string') {
          return (
            <h2 key={index} className="font-display text-xl font-semibold text-ink-900">
              {block.value}
            </h2>
          );
        }
        return null;
      })}
    </div>
  );
}
