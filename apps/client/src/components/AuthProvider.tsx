import type { ReactNode } from 'react';
import { getCurrentUser } from '../auth';
import { AuthContext } from '../hooks/auth-context';
import { useAsync } from '../hooks/useAsync';

// Fetches the current user once per page load and shares it app-wide, so
// ProtectedRoute, Layout, and pages don't each hit /api/auth/me.
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, loading } = useAsync(() => getCurrentUser());

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading, authenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
