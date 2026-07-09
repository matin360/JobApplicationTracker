import { expect, test } from '@playwright/test';
import { makeTestUser, signUpViaApi } from './helpers';

test.describe('login page', () => {
  test('renders the sign-in form by default', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('toggles between login and signup modes', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByPlaceholder('Jane Doe')).toBeVisible();

    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByPlaceholder('Jane Doe')).not.toBeVisible();
  });

  test('shows validation hints for invalid email and short password', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('not-an-email');
    await page.getByPlaceholder('At least 8 characters').fill('short');

    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  test('shows an error for wrong credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('nobody@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signs in an existing user and lands on the dashboard', async ({ page, context }) => {
    const user = makeTestUser('login');

    // Create the account via the API, then clear cookies so we exercise a fresh login.
    await page.goto('/login');
    await signUpViaApi(page, user);
    await context.clearCookies();

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('At least 8 characters').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('signup page', () => {
  test('creates a new account and lands on the dashboard', async ({ page }) => {
    const user = makeTestUser('signup');

    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await page.getByPlaceholder('Jane Doe').fill(user.name);
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('At least 8 characters').fill(user.password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: `${user.name} ▾` })).toBeVisible();
  });

  test('rejects signing up with an email that is already registered', async ({ page, context }) => {
    const user = makeTestUser('duplicate');

    await page.goto('/login');
    await signUpViaApi(page, user);
    await context.clearCookies();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.getByPlaceholder('Jane Doe').fill(user.name);
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('At least 8 characters').fill(user.password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('An account with that email already exists.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
