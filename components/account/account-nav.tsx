import Link from 'next/link';
import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/compte', label: 'Vue d’ensemble' },
  { href: '/compte/commandes', label: 'Commandes' },
  { href: '/compte/adresses', label: 'Adresses' },
];

export function AccountNav({ current }: { current: string }) {
  return (
    <nav aria-label="Compte" className="flex gap-1 overflow-x-auto border-b border-ink-200/70 pb-px">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? 'page' : undefined}
          className={cn(
            'shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
            current === link.href
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-500 hover:text-ink-900',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
