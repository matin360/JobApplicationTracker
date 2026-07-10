import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthProvider from '../src/components/AuthProvider';
import useAuth from '../src/hooks/useAuth';
import * as auth from '../src/auth';

vi.mock('../src/auth', () => ({
  getCurrentUser: vi.fn()
}));

describe('useAuth', () => {
  const TestComponent = () => {
    const { user, loading, authenticated } = useAuth();

    return (
      <div>
        <span>{loading ? 'loading' : 'loaded'}</span>
        <span>{user?.email ?? 'null'}</span>
        <span>{authenticated ? 'yes' : 'no'}</span>
      </div>
    );
  };

  const renderWithProvider = () =>
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

  it('returns an authenticated user when getCurrentUser resolves', async () => {
    const fakeUser = { id: '1', email: 'user@example.com', name: 'User' };
    vi.mocked(auth.getCurrentUser).mockResolvedValue(fakeUser);

    renderWithProvider();

    await waitFor(() => expect(screen.getByText(/user@example.com/i)).toBeInTheDocument());
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/yes/i)).toBeInTheDocument();
  });

  it('returns unauthenticated when getCurrentUser returns null', async () => {
    vi.mocked(auth.getCurrentUser).mockResolvedValue(null);

    renderWithProvider();

    await waitFor(() => expect(screen.getByText(/null/i)).toBeInTheDocument());
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/no/i)).toBeInTheDocument();
  });
});
