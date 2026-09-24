import type { Metadata, Viewport } from 'next';
import { CookieBanner } from '@/components/legal/cookie-banner';
import { Campaigns } from '@/components/marketing/campaigns';
import { getStoreSettings } from '@/lib/data/settings';
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

/**
 * Titre des onglets et des partages.
 *
 * L'enseigne vient du réglage `store.name`, comme partout ailleurs : l'écrire
 * ici obligerait à repasser dans le code le jour où le client en change, et
 * c'est exactement ce que les conventions du projet interdisent.
 */
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreSettings();

  return {
    title: {
      default: `${store.name} — meubles, électronique et épicerie`,
      template: `%s — ${store.name}`,
    },
    description:
      'Meubles, électronique et produits alimentaires, livrés en France et au Canada.',
  };
}

export const viewport: Viewport = {
  themeColor: '#fbfbf8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        {/* Avant le contenu : la barre d'annonce coiffe la page, comme le
            bandeau qu'elle remplace. */}
        <Campaigns />
        {children}
        {/* Dans la mise en page racine et non dans chaque page : une seule
            adresse oubliée suffirait à afficher un traceur sans consentement. */}
        <CookieBanner />
      </body>
    </html>
  );
}
