import { apiFetch } from '@/lib/api';

/**
 * Panier et commande, branchés sur `GET/POST/PATCH/DELETE /cart` et
 * `/checkout/*`.
 *
 * Le jeton de panier voyage en cookie `httpOnly` posé par l'API : ces
 * fonctions n'y touchent jamais, `credentials: 'include'` (déjà dans
 * `apiFetch`) suffit.
 */

export type CartLine = {
  cartItemId: string;
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  variantName: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  discountCents: number;
  netCents: number;
  taxCents: number;
  ecoTaxCents: number;
  requiresShipping: boolean;
  availableQuantity: number;
  hasEnoughStock: boolean;
  priceChanged: boolean;
};

export type TaxLine = { name: string; jurisdiction: string | null; ratePercent: number; amountCents: number };
export type AppliedDiscount = { promotionId: string; code: string | null; label: string; scope: string; amountCents: number; freeShipping: boolean };
export type Address = {
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  region?: string;
  countryCode: string;
  phone?: string;
  vatNumber?: string;
  notes?: string;
};

export type Cart = {
  id: string;
  token: string;
  status: string;
  email: string | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  currencyCode: string;
  pricesIncludeTax: boolean;
  lines: CartLine[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  ecoTaxCents: number;
  discountCents: number;
  totalCents: number;
  taxLines: TaxLine[];
  discounts: AppliedDiscount[];
  rejectedCoupons: Array<{ code: string; reason: string }>;
  shippingMethodId: string | null;
  hasStockIssue: boolean;
  requiresShipping: boolean;
};

/**
 * Panier vide, fabriqué localement.
 *
 * Même forme que celui de l'API, tous les compteurs à zéro. Il évite de
 * demander un panier au serveur quand on sait qu'il n'y en a pas.
 */
function emptyCart(): Cart {
  return {
    id: '',
    token: '',
    status: 'ACTIVE',
    email: null,
    shippingAddress: null,
    billingAddress: null,
    currencyCode: 'EUR',
    pricesIncludeTax: true,
    lines: [],
    subtotalCents: 0,
    shippingCents: 0,
    taxCents: 0,
    ecoTaxCents: 0,
    discountCents: 0,
    totalCents: 0,
    taxLines: [],
    discounts: [],
    rejectedCoupons: [],
    shippingMethodId: null,
    hasStockIssue: false,
    requiresShipping: false,
  };
}

/**
 * Panier courant.
 *
 * **Ne demande rien à l'API tant qu'aucun panier n'existe.** `GET /cart` crée
 * le panier s'il n'en trouve pas, et le `Set-Cookie` de la réponse revient au
 * serveur Next, pas au navigateur : rendre l'en-tête d'une page créait donc
 * une ligne en base à chaque affichage, sans que le visiteur en garde jamais
 * la trace. Mesuré en production : trois visites de la page d'accueil, trois
 * paniers.
 *
 * Un visiteur qui n'a rien ajouté n'a pas de panier, et c'est exact — il en
 * obtient un au premier `POST /cart/items`, appelé depuis le navigateur, où
 * le cookie revient à son destinataire.
 *
 * La session connectée compte aussi : l'API rattache alors le panier au
 * compte, sans cookie de panier.
 */
export async function getCart(): Promise<Cart> {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const jar = await cookies();

    if (!jar.get('cart_token') && !jar.get('access_token')) return emptyCart();
  }

  try {
    return await apiFetch<Cart>('/cart');
  } catch {
    // Un panier illisible ne doit pas faire tomber la page : l'en-tête et le
    // pied de page en dépendent, donc toute la boutique.
    return emptyCart();
  }
}

export async function addCartItem(variantId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return apiFetch<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' });
}

export async function setContact(input: {
  email: string;
  shippingAddress: Address;
  billingAddress?: Address;
  billingSameAsShipping: boolean;
}): Promise<Cart> {
  return apiFetch<Cart>('/cart/contact', { method: 'PATCH', body: JSON.stringify(input) });
}

export type ShippingQuote = {
  methodId: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  currencyCode: string;
  isFree: boolean;
  requiresSlot: boolean;
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
};

export async function getShippingOptions(): Promise<ShippingQuote[]> {
  return apiFetch<ShippingQuote[]>('/cart/shipping-options');
}

export async function setShippingMethod(methodId: string): Promise<Cart> {
  return apiFetch<Cart>('/cart/shipping-method', { method: 'PATCH', body: JSON.stringify({ methodId }) });
}

export async function applyCoupon(code: string): Promise<Cart> {
  return apiFetch<Cart>('/cart/coupons', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function removeCoupon(code: string): Promise<Cart> {
  return apiFetch<Cart>(`/cart/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

export type PaymentMethod = { code: string; capturesImmediately: boolean };

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>('/checkout/payment-methods');
}

export type PlaceOrderResult = {
  order: { id: string; number: string; totalCents: number; currencyCode: string; email: string };
  guestAccessToken: string | null;
  payment: { provider: string; instructions: string | null };
};

export async function placeOrder(
  idempotencyKey: string,
  input: {
    email: string;
    shippingAddress: Address;
    billingAddress?: Address;
    billingSameAsShipping: boolean;
    /** L'un ou l'autre : un panier scindé porte un mode par groupe. */
    shippingMethodId?: string;
    shipments?: Array<{ constraint: ShippingConstraint; methodId: string; slotId?: string }>;
    paymentProvider: string;
    customerNote?: string;
    acceptsTerms: boolean;
    acceptsMarketing?: boolean;
  },
): Promise<PlaceOrderResult> {
  return apiFetch<PlaceOrderResult>('/checkout/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(input),
  });
}

/** Ce qui empêche un groupe d'articles de partir avec les autres. */
export type ShippingConstraint = 'COLD_CHAIN' | 'OVERSIZED' | 'STANDARD';

export type ShippingGroup = {
  constraint: ShippingConstraint;
  cartItemIds: string[];
  options: ShippingQuote[];
};

export type ShippingPlan = {
  splitRequired: boolean;
  combined: ShippingQuote[];
  groups: ShippingGroup[];
};

/**
 * Plan de livraison du panier.
 *
 * Distinct de `getShippingOptions`, qui rend une liste plate et ne dit rien
 * quand elle est vide. Celui-ci explique *pourquoi* : un meuble hors gabarit et
 * une denrée réfrigérée ne trouvent aucun transporteur commun, et la commande
 * n'est livrable qu'en deux expéditions.
 */
export async function getShippingPlan(): Promise<ShippingPlan> {
  try {
    return await apiFetch<ShippingPlan>('/cart/shipping-plan');
  } catch {
    /* Le plan est un supplément d'explication : son échec ne doit pas
       empêcher le tunnel de fonctionner avec la liste plate. */
    return { splitRequired: false, combined: [], groups: [] };
  }
}

/**
 * Enregistre un mode de livraison par groupe.
 *
 * Remplace l'ensemble à chaque appel, comme l'API : un panier modifié
 * entre-temps ne doit pas garder le choix d'un groupe disparu.
 */
export async function setCartShipments(
  shipments: Array<{ constraint: ShippingConstraint; methodId: string; slotId?: string }>,
): Promise<Cart> {
  return apiFetch<Cart>('/cart/shipments', {
    method: 'PATCH',
    body: JSON.stringify({ shipments }),
  });
}
