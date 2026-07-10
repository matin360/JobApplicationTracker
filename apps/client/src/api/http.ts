// Shared HTTP plumbing for every API module.
//
// When VITE_API_URL is defined, requests go to it as absolute URLs; otherwise
// relative paths let the Vite dev server proxy /api to the backend.
const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

export function buildApiUrl(path: string): string {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

// JSON request with cookie credentials. Returns the parsed body; a 204 returns
// undefined. Non-2xx throws an Error carrying the server's `error` message when
// there is one, or a generic status message otherwise.
export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body; fall through to the status check below.
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed. (${response.status} ${response.statusText})`;
    throw new Error(message);
  }

  return payload as T;
}
