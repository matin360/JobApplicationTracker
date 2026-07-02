import type { ReactNode } from 'react';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute = ({ children, fallback = <p>Loading…</p> }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!user) {
    window.location.assign('/login');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
