import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Sortie autonome : l'image Docker ne copie que server.js et les
  // node_modules réellement utilisés, pas tout le dépôt.
  output: 'standalone',
  images: {
    /*
     * Cloudinary sert les visuels du client, avec ses propres déclinaisons.
     * Unsplash n'est là que pour les données de démonstration et devra
     * disparaître de cette liste.
     */
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
