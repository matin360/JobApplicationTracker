import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../src/components/ProtectedRoute';
import useAuth from '../src/hooks/useAuth';

vi.mock('../src/hooks/useAuth', () => ({
  __esModule: true,
  default: vi.fn()
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', assign: vi.fn() }
    });
  });

  it('shows loading fallback while auth is loading', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, loading: true, authenticated: false });

    render(
      <ProtectedRoute>
        <div>Protected</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, loading: false, authenticated: false });

    render(
      <ProtectedRoute>
        <div>Protected</div>
      </ProtectedRoute>
    );

    expect(window.location.assign).toHaveBeenCalledWith('/login');
  });

  it('renders children when authenticated', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: '1', email: 'x@example.com', name: 'X' }, loading: false, authenticated: true });

    render(
      <ProtectedRoute>
        <div>Protected</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/Protected/i)).toBeInTheDocument();
  });
});
