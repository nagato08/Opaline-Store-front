import type { ProductSummary } from '@/components/product/product-card';

/*
 * Données de démonstration.
 *
 * L'API existe et expose tout ce qu'il faut (`/catalog/products`, `/search`),
 * mais rien n'est encore branché : ces valeurs servent à valider la mise en
 * page. Les photos viennent d'Unsplash, à remplacer par les visuels du client
 * servis par Cloudinary.
 */

const photo = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

/*
 * Aucune photo ne doit montrer le logo d'une marque réelle : associer une
 * marque existante à un produit fictif est trompeur, et le sera encore plus
 * quand ces visuels seront remplacés par ceux du client. Chaque candidate a
 * été téléchargée et regardée avant d'entrer ici — deux ont été écartées en
 * cours de route (une canette de marque, un four à micro-ondes de marque).
 */

export type Subcategory = { slug: string; label: string };

export type Department = {
  slug: string;
  label: string;
  tagline: string;
  imageUrl: string;
  imageAlt: string;
  subcategories: Subcategory[];
};

/**
 * Rayons et sous-rayons.
 *
 * Chaque sous-rayon n'existe ici que parce qu'il a au moins un produit
 * derrière lui — un sous-menu qui mène vers une page vide est pire qu'une
 * navigation plus courte mais entièrement vraie.
 */
export const departments: Department[] = [
  {
    slug: 'meubles',
    label: 'Meubles',
    tagline: 'Salon, luminaires, rangement',
    imageUrl: photo('photo-1555041469-a586c61ea9bc', 900),
    imageAlt: 'Canapé clair dans un salon lumineux',
    subcategories: [
      { slug: 'salon', label: 'Salon' },
      { slug: 'luminaires', label: 'Luminaires' },
      { slug: 'rangement', label: 'Rangement' },
    ],
  },
  {
    slug: 'electronique',
    label: 'Électronique',
    tagline: 'Son et image',
    imageUrl: photo('photo-1505740420928-5e560c06d30e', 900),
    imageAlt: 'Casque audio posé sur un bureau en bois',
    subcategories: [{ slug: 'son', label: 'Son' }],
  },
  {
    slug: 'epicerie',
    label: 'Épicerie',
    tagline: 'Produits secs, épicerie fine, boissons',
    imageUrl: photo('photo-1542838132-92c53300491e', 900),
    imageAlt: 'Étal de fruits et légumes sur un marché',
    subcategories: [
      { slug: 'produits-secs', label: 'Produits secs' },
      { slug: 'epicerie-fine', label: 'Épicerie fine' },
      { slug: 'boissons', label: 'Boissons' },
    ],
  },
];

export function departmentBySlug(slug: string): Department | undefined {
  return departments.find((department) => department.slug === slug);
}

export type DemoProduct = ProductSummary & {
  department: string;
  subcategory: string;
};

export const featured: DemoProduct[] = [
  {
    id: '1',
    name: 'Canapé d’angle Oslo, tissu gris',
    slug: 'canape-d-angle-oslo',
    brand: 'Maison Nord',
    imageUrl: photo('photo-1555041469-a586c61ea9bc'),
    imageAlt: 'Canapé d’angle en tissu gris clair',
    priceCents: 129900,
    compareAtCents: 149900,
    currencyCode: 'EUR',
    isAvailable: true,
    ecoTaxCents: 1200,
    ratingAvg: 4.6,
    ratingCount: 38,
    department: 'meubles',
    subcategory: 'salon',
  },
  {
    id: '2',
    name: 'Riz basmati bio, 1 kg',
    slug: 'riz-basmati-bio',
    brand: 'Ferme du Val',
    imageUrl: photo('photo-1586201375761-83865001e31c'),
    imageAlt: 'Sachet de riz basmati posé sur un plan de travail',
    priceCents: 499,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: true,
    measure: { quantity: 1, unit: 'kg' },
    ratingAvg: 4.2,
    ratingCount: 12,
    department: 'epicerie',
    subcategory: 'produits-secs',
  },
  {
    id: '3',
    name: 'Casque sans fil Aria, réduction de bruit',
    slug: 'casque-sans-fil-aria',
    brand: 'Aria Audio',
    imageUrl: photo('photo-1505740420928-5e560c06d30e'),
    imageAlt: 'Casque audio noir sur fond clair',
    priceCents: 18900,
    compareAtCents: 24900,
    currencyCode: 'EUR',
    isAvailable: true,
    ecoTaxCents: 50,
    ratingAvg: 4.8,
    ratingCount: 214,
    department: 'electronique',
    subcategory: 'son',
  },
  {
    id: '4',
    name: 'Lampe d’appoint Arc, laiton',
    slug: 'lampe-d-appoint-arc',
    brand: 'Maison Nord',
    imageUrl: photo('photo-1507473885765-e6ed057f782c'),
    imageAlt: 'Lampe à poser en laiton allumée',
    priceCents: 8900,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: false,
    ecoTaxCents: 20,
    ratingAvg: 4.4,
    ratingCount: 27,
    department: 'meubles',
    subcategory: 'luminaires',
  },
  {
    id: '5',
    name: 'Huile d’olive vierge extra, 75 cl',
    slug: 'huile-olive-vierge-extra',
    brand: 'Ferme du Val',
    imageUrl: photo('photo-1474979266404-7eaacbcd87c5'),
    imageAlt: 'Bouteille d’huile d’olive sur une table en bois',
    priceCents: 1290,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: true,
    measure: { quantity: 0.75, unit: 'L' },
    ratingAvg: 4.7,
    ratingCount: 63,
    department: 'epicerie',
    subcategory: 'epicerie-fine',
  },
  {
    id: '6',
    name: 'Table d’appoint Lund, chêne et laqué blanc',
    slug: 'table-appoint-lund',
    brand: 'Maison Nord',
    imageUrl: photo('photo-1499933374294-4584851497cc'),
    imageAlt: 'Table d’appoint ronde à pieds de chêne, près d’un lit',
    priceCents: 34900,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: true,
    ecoTaxCents: 400,
    ratingAvg: 4.5,
    ratingCount: 19,
    department: 'meubles',
    subcategory: 'salon',
  },
  {
    id: '7',
    name: 'Enceinte portable Tono',
    slug: 'enceinte-portable-tono',
    brand: 'Aria Audio',
    imageUrl: photo('photo-1531104985437-603d6490e6d4'),
    imageAlt: 'Enceinte noire posée sur un support métallique',
    priceCents: 7900,
    compareAtCents: 9900,
    currencyCode: 'EUR',
    isAvailable: true,
    ecoTaxCents: 20,
    ratingAvg: 4.1,
    ratingCount: 88,
    department: 'electronique',
    subcategory: 'son',
  },
  {
    id: '8',
    name: 'Miel de châtaignier, 250 g',
    slug: 'miel-de-chataignier',
    brand: 'Ferme du Val',
    imageUrl: photo('photo-1558642452-9d2a7deb7f62'),
    imageAlt: 'Pot de miel ambré et cuillère en bois',
    priceCents: 890,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: true,
    measure: { quantity: 0.25, unit: 'kg' },
    ratingAvg: 4.9,
    ratingCount: 41,
    department: 'epicerie',
    subcategory: 'epicerie-fine',
  },
  {
    id: '9',
    name: 'Meuble de rangement mural Fjord, chêne clair',
    slug: 'rangement-mural-fjord',
    brand: 'Maison Nord',
    imageUrl: photo('photo-1595428774223-ef52624120d2'),
    imageAlt: 'Meuble de rangement mural en bois clair à casiers ouverts',
    priceCents: 24900,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: true,
    ecoTaxCents: 300,
    ratingAvg: 4.3,
    ratingCount: 16,
    department: 'meubles',
    subcategory: 'rangement',
  },
  {
    id: '10',
    name: 'Jus d’orange pressé, 1 L',
    slug: 'jus-orange-presse',
    brand: 'Ferme du Val',
    imageUrl: photo('photo-1600271886742-f049cd451bba'),
    imageAlt: 'Verre de jus d’orange pressé garni d’une rondelle d’orange',
    priceCents: 390,
    compareAtCents: null,
    currencyCode: 'EUR',
    isAvailable: true,
    measure: { quantity: 1, unit: 'L' },
    ratingAvg: 4.4,
    ratingCount: 9,
    department: 'epicerie',
    subcategory: 'boissons',
  },
];

/** Produits d'un rayon, et de son sous-rayon si précisé. */
export function productsOf(departmentSlug: string, subcategorySlug?: string): DemoProduct[] {
  return featured.filter(
    (product) =>
      product.department === departmentSlug &&
      (subcategorySlug ? product.subcategory === subcategorySlug : true),
  );
}

/** Compte de produits par sous-rayon, pour l'afficher à côté de son libellé. */
export function subcategoryCounts(departmentSlug: string): Record<string, number> {
  return productsOf(departmentSlug).reduce<Record<string, number>>((counts, product) => {
    counts[product.subcategory] = (counts[product.subcategory] ?? 0) + 1;
    return counts;
  }, {});
}

/** Les mieux notés, tous rayons confondus — pour la page d'accueil. */
export function bestRated(limit: number): DemoProduct[] {
  return [...featured]
    .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0))
    .slice(0, limit);
}

export type Testimonial = {
  author: string;
  city: string;
  rating: number;
  quote: string;
};

/**
 * Avis clients.
 *
 * Texte seul : le champ existe côté API pour des photos d'avis, mais aucune
 * route de téléversement n'est ouverte. Construire un écran avec photo serait
 * bâtir sur du vide.
 */
export const testimonials: Testimonial[] = [
  {
    author: 'Camille B.',
    city: 'Paris',
    rating: 5,
    quote:
      'Le canapé Oslo est arrivé emballé avec soin, monté en vingt minutes. La chaîne du froid a été respectée sur ma commande d’épicerie livrée le même jour.',
  },
  {
    author: 'Mathieu R.',
    city: 'Québec',
    rating: 5,
    quote:
      'Premier achat de meuble livré au Canada sans surprise sur les taxes à la réception — tout était annoncé avant le paiement.',
  },
  {
    author: 'Inès F.',
    city: 'Lyon',
    rating: 4,
    quote:
      'Le miel de châtaignier est excellent, et le suivi de commande sans création de compte est appréciable quand on est pressé.',
  },
];
