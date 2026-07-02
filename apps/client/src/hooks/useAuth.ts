import { useEffect, useState } from 'react';
import type { AuthUser } from '../auth';
import { getCurrentUser } from '../auth';

export interface AuthStatus {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
}

const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    loading,
    authenticated: Boolean(user)
  } satisfies AuthStatus;
};

export default useAuth;
