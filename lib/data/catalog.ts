import { apiFetch, ApiError } from '@/lib/api';
import type { ProductSummary } from '@/components/product/product-card';

/**
 * Catalogue, branché sur `GET /catalog/*`.
 *
 * Le contexte boutique (langue, devise, pays) n'est pas encore choisi par le
 * visiteur — aucun sélecteur n'existe sur ce scaffold — donc aucun paramètre
 * n'est transmis : l'API retombe sur ses valeurs par défaut (FR/EUR/FR), qui
 * correspondent au marché principal.
 */

export type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
  children: Category[];
};

export async function getCategoryTree(): Promise<Category[]> {
  return apiFetch<Category[]>('/catalog/categories');
}

export async function getCategoryBySlug(slug: string): Promise<{ id: string; name: string; slug: string; description: string | null } | null> {
  try {
    return await apiFetch('/catalog/categories/' + encodeURIComponent(slug));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

type ApiProductCard = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  brand: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  compareAtCents: number | null;
  currencyCode: string;
  ecoTaxCents: number;
  ratingAvg: number;
  ratingCount: number;
  isAvailable: boolean;
};

function toSummary(card: ApiProductCard): ProductSummary {
  return {
    id: card.id,
    name: card.name,
    slug: card.slug,
    brand: card.brand,
    imageUrl: card.imageUrl,
    imageAlt: card.name,
    priceCents: card.priceCents ?? 0,
    compareAtCents: card.compareAtCents,
    currencyCode: card.currencyCode,
    isAvailable: card.isAvailable,
    ecoTaxCents: card.ecoTaxCents || undefined,
    ratingAvg: card.ratingAvg || undefined,
    ratingCount: card.ratingCount || undefined,
  };
}

export type ProductListResult = { products: ProductSummary[]; total: number };

export type Brand = { id: string; name: string; slug: string };

/**
 * Marques du catalogue.
 *
 * Les cartes produit ne portent que le nom de la marque, et le filtre de
 * l'API attend son identifiant : c'est cette liste qui fait le pont entre les
 * deux.
 */
export async function listBrands(): Promise<Brand[]> {
  try {
    const brands = await apiFetch<Array<{ id: string; name: string; slug: string }>>(
      '/catalog/brands',
    );
    return brands.map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug }));
  } catch {
    /* Une liste de marques indisponible retire le filtre, elle ne doit pas
       emporter le rayon avec elle. */
    return [];
  }
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'best_selling' | 'rating';

export async function listProducts(params: {
  categorySlug?: string;
  search?: string;
  sort?: ProductSort;
  /** Filtres du rayon, tous portés par `ProductQueryDto` côté API. */
  brandIds?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly?: boolean;
  perPage?: number;
}): Promise<ProductListResult> {
  const query = new URLSearchParams();
  if (params.categorySlug) query.set('categorySlug', params.categorySlug);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  /* Répété plutôt que joint par des virgules : `@IsArray()` attend
     `brandIds=a&brandIds=b`. Une valeur unique arrive alors comme une chaîne,
     que le DTO normalise en tableau — sans quoi cocher une seule marque
     répondait « brandIds must be an array ». */
  for (const brandId of params.brandIds ?? []) query.append('brandIds', brandId);
  if (params.minPriceCents !== undefined) query.set('minPriceCents', String(params.minPriceCents));
  if (params.maxPriceCents !== undefined) query.set('maxPriceCents', String(params.maxPriceCents));
  if (params.inStockOnly) query.set('inStockOnly', 'true');
  query.set('perPage', String(params.perPage ?? 24));

  const page = await apiFetch<{ items: ApiProductCard[]; meta: { total: number } }>(
    `/catalog/products?${query}`,
  );

  return { products: page.items.map(toSummary), total: page.meta.total };
}

export type ProductVariant = {
  id: string;
  sku: string;
  optionValueIds: string[];
  price: {
    currencyCode: string;
    amountCents: number;
    compareAtCents: number | null;
    netCents: number;
    taxCents: number;
  } | null;
  measure: { unit: string | null; step: number; min: number; netContent: number | null; netContentUnit: string | null; unitPriceCents: number | null } | null;
  shipping: { weightGrams: number | null; isOversized: boolean };
  stock: { available: number; isAvailable: boolean };
};

export type ProductOption = {
  id: string;
  code: string;
  name: string;
  displayAs: string;
  values: Array<{ id: string; code: string; label: string; hexColor: string | null }>;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  seo: { title: string; description: string };
  brand: { id: string; name: string; slug: string } | null;
  categories: Array<{ id: string; name: string; slug: string; isPrimary: boolean }>;
  media: Array<{ id: string; url: string; variants: { placeholder: string; thumbnail: string; card: string; zoom: string } | null; alt: string; variantId: string | null }>;
  options: ProductOption[];
  compliance: {
    warrantyMonths: number | null;
    ecoTaxCents: number;
    countryOfOrigin: string | null;
    energyLabel: string | null;
    food: {
      allergens: string[];
      nutrition: unknown;
      requiresColdChain: boolean;
      storageTempMin: number | null;
      storageTempMax: number | null;
      originCountry: string | null;
      alcoholDegree: number | null;
      ingredients: string | null;
      storageAdvice: string | null;
      usageAdvice: string | null;
      legalNotice: string | null;
    } | null;
  };
  rating: { average: number; count: number };
  variants: ProductVariant[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiFetch<ProductDetail>(`/catalog/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// --- Avis clients ------------------------------------------------------------

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  isVerifiedPurchase: boolean;
  /** Réponse publique du commerçant, écrite au moment de la modération. */
  reply: string | null;
  createdAt: string;
};

export type ReviewSummary = {
  reviews: Review[];
  total: number;
  /** Nombre d'avis par note, de 5 à 1 — l'ordre vient de l'API. */
  distribution: Array<{ rating: number; count: number }>;
};

/**
 * Avis publiés d'un produit.
 *
 * Seuls les avis approuvés en modération sortent de l'API : rien à filtrer
 * ici. Un échec ne doit pas emporter la fiche produit — elle vend, les avis
 * l'accompagnent.
 */
export async function listReviews(productId: string): Promise<ReviewSummary> {
  try {
    const page = await apiFetch<{
      items: Review[];
      meta: { total: number };
      distribution: Array<{ rating: number; count: number }>;
    }>(`/products/${encodeURIComponent(productId)}/reviews?perPage=10`);

    return { reviews: page.items, total: page.meta.total, distribution: page.distribution };
  } catch {
    return { reviews: [], total: 0, distribution: [] };
  }
}

/**
 * Quelques avis réels, pour la page d'accueil.
 *
 * Il n'existe pas de route « tous les avis de la boutique » : ils sont indexés
 * par produit. On interroge donc les premiers produits mis en avant, ce qui
 * borne le coût — quatre appels, pas un par article du catalogue.
 *
 * Seuls les avis portant un texte sont retenus : une note sans commentaire ne
 * raconte rien dans une section qui cite des clients. Rien à afficher rend un
 * tableau vide, et la section disparaît — c'est préférable à des témoignages
 * inventés, qui sont une pratique commerciale trompeuse.
 */
export async function listHomeReviews(productIds: string[], limit = 3): Promise<Review[]> {
  const summaries = await Promise.all(productIds.slice(0, 4).map((id) => listReviews(id)));

  return summaries
    .flatMap((summary) => summary.reviews)
    .filter((review) => review.body && review.body.trim().length > 0)
    .sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
