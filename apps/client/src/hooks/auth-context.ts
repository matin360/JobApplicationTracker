import { createContext } from 'react';
import type { AuthUser } from '../auth';

export interface AuthStatus {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
}

// Filled by <AuthProvider>; read via the useAuth hook.
export const AuthContext = createContext<AuthStatus | null>(null);
