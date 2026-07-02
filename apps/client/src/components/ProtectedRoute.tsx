import type { ReactNode } from 'react';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute = ({ children, fallback = <p>Loading…</p> }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // While auth is loading, show a fallback to avoid flashing protected content.
  if (loading) {
    return <>{fallback}</>;
  }

  // If there is no authenticated user, redirect to the login page.
  if (!user) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
