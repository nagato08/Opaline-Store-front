/**
 * Client API, côté serveur (Server Components) et navigateur.
 *
 * `NEXT_PUBLIC_API_URL` est figé dans le bundle au build : il porte l'adresse
 * publique de l'API, utilisable aussi bien depuis le serveur Next que depuis
 * le navigateur.
 */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Cookies de la requête entrante, à transmettre à l'API depuis un composant
 * serveur.
 *
 * `credentials: 'include'` ne fait rien côté serveur — c'est un mécanisme du
 * `fetch` du navigateur, pas de celui de Node. Sans ce relais explicite, un
 * appel fait pendant le rendu serveur repartirait sans le jeton de panier ni
 * la session, et verrait un panier différent de celui du navigateur.
 */
async function serverCookieHeader(): Promise<string | null> {
  if (typeof window !== 'undefined') return null;

  try {
    const { cookies } = await import('next/headers');
    const jar = await cookies();
    const all = jar.getAll();
    return all.length > 0 ? all.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ') : null;
  } catch {
    // Hors d'une requête (build, script) : pas de cookies à relayer.
    return null;
  }
}

/**
 * Appel à l'API boutique.
 *
 * `credentials: 'include'` couvre le navigateur ; `serverCookieHeader`
 * couvre le rendu serveur. Le panier et la session client voyagent en
 * cookies `httpOnly`, jamais manipulés directement ici.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieHeader = await serverCookieHeader();

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    throw new ApiError(response.status, message ?? `Erreur API (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
