import { apiFetch } from '@/lib/api';
import type { ProductSummary } from '@/components/product/product-card';

/** Recherche, branchée sur `GET /search`. */

type ApiSearchHit = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  compareAtCents: number | null;
  currencyCode: string;
  ratingAvg: number;
  ratingCount: number;
  isAvailable: boolean;
};

export type FacetBucket = { value: string; label: string; count: number };

export type SearchFacets = {
  categories: FacetBucket[];
  brands: FacetBucket[];
  priceRange: { minCents: number; maxCents: number } | null;
  availability: { inStock: number; outOfStock: number };
};

export type SearchResult = {
  products: ProductSummary[];
  total: number;
  facets: SearchFacets;
  correctedTerm: string | null;
};

function toSummary(hit: ApiSearchHit): ProductSummary {
  return {
    id: hit.id,
    name: hit.name,
    slug: hit.slug,
    brand: hit.brand,
    imageUrl: hit.imageUrl,
    imageAlt: hit.name,
    priceCents: hit.priceCents ?? 0,
    compareAtCents: hit.compareAtCents,
    currencyCode: hit.currencyCode,
    isAvailable: hit.isAvailable,
    ratingAvg: hit.ratingAvg || undefined,
    ratingCount: hit.ratingCount || undefined,
  };
}

export async function search(params: {
  q?: string;
  categoryIds?: string[];
  brandIds?: string[];
  inStockOnly?: boolean;
  perPage?: number;
}): Promise<SearchResult> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  for (const id of params.categoryIds ?? []) query.append('categoryIds', id);
  for (const id of params.brandIds ?? []) query.append('brandIds', id);
  if (params.inStockOnly) query.set('inStockOnly', 'true');
  query.set('perPage', String(params.perPage ?? 24));

  const page = await apiFetch<{
    items: ApiSearchHit[];
    meta: { total: number };
    facets: SearchFacets;
    correctedTerm: string | null;
  }>(`/search?${query}`);

  return {
    products: page.items.map(toSummary),
    total: page.meta.total,
    facets: page.facets,
    correctedTerm: page.correctedTerm,
  };
}
