import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import ProtectedRoute from '../src/components/ProtectedRoute';
import useAuth from '../src/hooks/useAuth';
import * as auth from '../src/auth';

vi.mock('../src/hooks/useAuth', () => ({
  __esModule: true,
  default: vi.fn()
}));

vi.mock('../src/auth', () => ({
  getCurrentUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
}));

describe('ProtectedRoute', () => {
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', assign: assignMock }
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

    expect(assignMock).toHaveBeenCalledWith('/login');
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

describe('App sign out', () => {
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', assign: assignMock }
    });
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', email: 'x@example.com', name: 'X' },
      loading: false,
      authenticated: true
    });
  });

  it('shows a sign out button on the protected page', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('signs out and redirects to /login when the button is clicked', async () => {
    (auth.signOut as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(auth.signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/login'));
  });

  it('disables the button and shows progress text while signing out', async () => {
    let resolveSignOut!: () => void;

    type SignOutFn = () => Promise<void>;

    const signOutMock = auth.signOut as unknown as ReturnType<typeof vi.fn> & {
      mockImplementation(fn: SignOutFn): void;
    };

    signOutMock.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    const button = await screen.findByRole('button', { name: /signing out…/i });
    expect(button).toBeDisabled();

    resolveSignOut();
    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/login'));
  });

  it('still redirects to /login when the logout request fails', async () => {
    (auth.signOut as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/login'));
  });
});
