import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import useAuth from '../src/hooks/useAuth';

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

vi.mock('../src/applications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/applications')>()),
  listApplications: vi.fn().mockResolvedValue([]),
  getApplication: vi.fn(),
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn()
}));

const mockAuth = (state: { user: { id: string; email: string; name: string | null } | null; loading: boolean }) => {
  (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    ...state,
    authenticated: Boolean(state.user)
  });
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );

const authenticatedUser = { id: '1', email: 'x@example.com', name: 'X' };

describe('route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading fallback while auth is loading', () => {
    mockAuth({ user: null, loading: true });

    renderAt('/dashboard');

    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users from protected pages to the login page', () => {
    mockAuth({ user: null, loading: false });

    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the login page without authentication', () => {
    mockAuth({ user: null, loading: false });

    renderAt('/login');

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth({ user: authenticatedUser, loading: false });
  });

  it('renders the dashboard at /dashboard inside the layout shell', () => {
    renderAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Job Application Tracker' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders the applications list at /applications', async () => {
    renderAt('/applications');

    expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument();
    expect(await screen.findByText(/No applications yet/i)).toBeInTheDocument();
  });

  it('renders settings at /settings', () => {
    renderAt('/settings');

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('x@example.com');
  });

  it('redirects unknown paths to the dashboard', () => {
    renderAt('/nonsense');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('marks the current page as active in the nav', () => {
    renderAt('/applications');

    expect(screen.getByRole('link', { name: 'Applications' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active');
  });
});
