export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  session: {
    expiresAt: string;
  };
}

// When VITE_API_URL is defined, use it; otherwise rely on a relative path.
// Relative paths let Vite proxy backend requests during local development.
const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

function buildApiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

// Returns the currently signed-in user or null if not authenticated.
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(buildApiUrl('/api/auth/me'), {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { user?: AuthUser | null };
    return payload.user ?? null;
  } catch {
    return null;
  }
}

async function parseAuthResponse(response: Response): Promise<AuthResponse | { error?: string } | null> {
  try {
    return (await response.json()) as AuthResponse | { error?: string };
  } catch {
    return null;
  }
}

export async function signIn(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await parseAuthResponse(response);

  if (!response.ok || !data || !('user' in data) || !('session' in data)) {
    const errorMessage = data && 'error' in data && typeof data.error === 'string'
      ? data.error
      : `Unable to sign in. (${response.status} ${response.statusText})`;
    throw new Error(errorMessage);
  }

  return data;
}

// Create a new account and establish an authenticated session.
export async function signUp(payload: { email: string; password: string; name?: string }): Promise<AuthResponse> {
  const response = await fetch(buildApiUrl('/api/auth/signup'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as AuthResponse | { error?: string };

  if (!response.ok || !('user' in data) || !('session' in data)) {
    const errorMessage = 'error' in data && typeof data.error === 'string' ? data.error : 'Unable to create an account.';
    throw new Error(errorMessage);
  }

  return data;
}

// Log the user out by clearing the server-side session and cookie.
export async function signOut(): Promise<void> {
  await fetch(buildApiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include'
  });
}
