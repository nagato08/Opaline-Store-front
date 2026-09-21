import { apiFetch, ApiError } from '@/lib/api';

/** Suivi de commande public, branché sur `GET /orders/track`. */

export type OrderAddress = {
  type: 'SHIPPING' | 'BILLING';
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
};

export type OrderItem = {
  id: string;
  sku: string;
  name: string;
  variantName: string | null;
  imageUrl: string | null;
  quantity: string;
  unitPriceCents: number;
  totalCents: number;
};

export type TrackedOrder = {
  id: string;
  number: string;
  email: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string;
  fulfillmentStatus: string;
  currencyCode: string;
  pricesIncludeTax: boolean;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  ecoTaxCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
  addresses: OrderAddress[];
  shipments: Array<{ status: string; trackingNumber: string | null; trackingUrl: string | null }>;
};

export async function trackOrderByToken(token: string): Promise<TrackedOrder | null> {
  try {
    return await apiFetch<TrackedOrder>(`/orders/track?token=${encodeURIComponent(token)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export async function trackOrderByNumber(number: string, email: string): Promise<TrackedOrder | null> {
  try {
    return await apiFetch<TrackedOrder>('/orders/track', {
      method: 'POST',
      body: JSON.stringify({ number, email }),
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
    throw error;
  }
}

/** Fiche d'une commande du compte connecté — distinct du suivi invité, sans jeton. */
export async function getMyOrder(number: string): Promise<TrackedOrder | null> {
  try {
    return await apiFetch<TrackedOrder>(`/orders/${encodeURIComponent(number)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}
