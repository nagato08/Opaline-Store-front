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

export async function getCart(): Promise<Cart> {
  return apiFetch<Cart>('/cart');
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
    shippingMethodId: string;
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
