import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../src/components/layout/Header';
import * as auth from '../src/auth';

vi.mock('../src/auth', () => ({
  signOut: vi.fn()
}));

const user = { id: '1', email: 'x@example.com', name: 'X' };

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header user={user} navOpen={false} onToggleNav={() => undefined} />
    </MemoryRouter>
  );

const openUserMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: /X ▾/ }));
};

describe('Header sign out', () => {
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/dashboard', assign: assignMock }
    });
  });

  it('shows the user menu with email and sign out button', () => {
    renderHeader();

    openUserMenu();

    expect(screen.getByText('x@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('signs out and redirects to /login when the button is clicked', async () => {
    vi.mocked(auth.signOut).mockResolvedValue(undefined);

    renderHeader();
    openUserMenu();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(auth.signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/login'));
  });

  it('disables the button and shows progress text while signing out', async () => {
    let resolveSignOut!: () => void;

    vi.mocked(auth.signOut).mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });
    });

    renderHeader();
    openUserMenu();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    const button = await screen.findByRole('button', { name: /signing out…/i });
    expect(button).toBeDisabled();

    resolveSignOut();
    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/login'));
  });

  it('still redirects to /login when the logout request fails', async () => {
    vi.mocked(auth.signOut).mockRejectedValue(new Error('network down'));

    renderHeader();
    openUserMenu();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/login'));
  });
});
