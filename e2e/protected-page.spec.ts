import { expect, test } from '@playwright/test';
import { makeTestUser, signUpViaApi } from './helpers';

test.describe('protected pages', () => {
  test('redirects unauthenticated visitors to /login', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('redirects unauthenticated visitors from every protected page', async ({ page }) => {
    for (const path of ['/dashboard', '/applications', '/settings']) {
      await page.goto(path);
      await page.waitForURL('**/login');
    }
  });

  test('shows the dashboard to a signed-in user', async ({ page }) => {
    const user = makeTestUser('dashboard');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upcoming reminders' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent applications' })).toBeVisible();
  });

  test('signing out from the user menu clears the session and redirects to /login', async ({ page }) => {
    const user = makeTestUser('signout');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/dashboard');

    // The session is valid before signing out.
    const meBefore = await page.request.get('/api/auth/me');
    expect(meBefore.status()).toBe(200);

    await page.getByRole('button', { name: `${user.name} ▾` }).click();
    await expect(page.getByText(user.email)).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/login');

    // The server no longer recognizes the session.
    const meAfter = await page.request.get('/api/auth/me');
    expect(meAfter.status()).toBe(401);

    // Revisiting a protected page bounces back to /login.
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
  });
});
