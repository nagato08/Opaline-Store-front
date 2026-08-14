import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
});

const sans = Public_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

/*
 * Le nom affiché vient du réglage `store.name` de l'API. En attendant qu'il
 * soit branché, un libellé neutre : écrire ici l'enseigne du client obligerait
 * à repasser dans le code le jour où il en change.
 */
export const metadata: Metadata = {
  title: {
    default: 'Boutique — meubles, électronique et épicerie',
    template: '%s — Boutique',
  },
  description:
    'Meubles, électronique et produits alimentaires, livrés en France et au Canada.',
};

export const viewport: Viewport = {
  themeColor: '#fbfbf8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
