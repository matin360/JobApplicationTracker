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

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { user?: AuthUser | null };
  return payload.user ?? null;
}

export async function signIn(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as AuthResponse | { error?: string };

  if (!response.ok || !('user' in data) || !('session' in data)) {
    const errorMessage = 'error' in data && typeof data.error === 'string' ? data.error : 'Unable to sign in.';
    throw new Error(errorMessage);
  }

  return data;
}

export async function signUp(payload: { email: string; password: string; name?: string }): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
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

export async function signOut(): Promise<void> {
  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}
