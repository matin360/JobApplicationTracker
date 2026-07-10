import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthForm from '../src/components/AuthForm';
import * as auth from '../src/auth';

vi.mock('../src/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn()
}));

describe('AuthForm', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { assign: vi.fn() },
      configurable: true
    });
  });

  it('renders login form and submits sign in', async () => {
    const fakeUser = { id: '1', email: 'user@example.com', name: 'User' };
    vi.mocked(auth.signIn).mockResolvedValue({ user: fakeUser, session: { expiresAt: new Date().toISOString() } });
    const onSuccess = vi.fn();

    render(<AuthForm mode="login" onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(auth.signIn).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' }));
    expect(onSuccess).toHaveBeenCalledWith(fakeUser);
  });

  it('renders signup form and submits sign up', async () => {
    const fakeUser = { id: '2', email: 'new@example.com', name: 'New User' };
    vi.mocked(auth.signUp).mockResolvedValue({ user: fakeUser, session: { expiresAt: new Date().toISOString() } });
    const onSuccess = vi.fn();

    render(<AuthForm mode="signup" onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'password123', name: 'New User' }));
    expect(onSuccess).toHaveBeenCalledWith(fakeUser);
  });
});
