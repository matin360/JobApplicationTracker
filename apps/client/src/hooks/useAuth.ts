import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthStatus } from './auth-context';

export type { AuthStatus } from './auth-context';

// Read the shared auth state provided by <AuthProvider>.
const useAuth = (): AuthStatus => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within <AuthProvider>.');
  }
  return value;
};

export default useAuth;
