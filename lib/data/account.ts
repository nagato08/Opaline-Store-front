import { apiFetch, ApiError } from '@/lib/api';
import type { Address } from './cart';

/** Compte client, branché sur `GET/PATCH /auth/me`, `/account/addresses`, `/orders`. */

export type Me = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  locale: string;
  currencyCode: string;
  acceptsMarketing: boolean;
  createdAt: string;
  accounts: Array<{ provider: string }>;
};

/** `null` si personne n'est connecté — jamais une exception pour ce cas attendu. */
export async function getMe(): Promise<Me | null> {
  try {
    return await apiFetch<Me>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function updateProfile(input: { firstName?: string; lastName?: string; phone?: string }): Promise<Me> {
  return apiFetch<Me>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

export type SavedAddress = Address & { id: string; label: string | null; isDefaultShipping: boolean; isDefaultBilling: boolean };

export async function listAddresses(): Promise<SavedAddress[]> {
  return apiFetch<SavedAddress[]>('/account/addresses');
}

export async function createAddress(input: Address & { label?: string }): Promise<SavedAddress> {
  return apiFetch<SavedAddress>('/account/addresses', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateAddress(id: string, input: Partial<Address> & { label?: string }): Promise<SavedAddress> {
  return apiFetch<SavedAddress>(`/account/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch(`/account/addresses/${id}`, { method: 'DELETE' });
}

export async function setDefaultShippingAddress(id: string): Promise<void> {
  await apiFetch(`/account/addresses/${id}/default-shipping`, { method: 'POST' });
}

export async function setDefaultBillingAddress(id: string): Promise<void> {
  await apiFetch(`/account/addresses/${id}/default-billing`, { method: 'POST' });
}

export type OrderHistoryItem = {
  id: string;
  number: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  totalCents: number;
  currencyCode: string;
  createdAt: string;
  items: Array<{ name: string }>;
};

export async function listMyOrders(): Promise<{ orders: OrderHistoryItem[]; total: number }> {
  const page = await apiFetch<{ items: OrderHistoryItem[]; meta: { total: number } }>('/orders?perPage=50');
  return { orders: page.items, total: page.meta.total };
}
