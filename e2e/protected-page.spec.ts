import { expect, test } from '@playwright/test';
import { makeTestUser, signUpViaApi } from './helpers';

test.describe('protected page', () => {
  test('redirects unauthenticated visitors to /login', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('shows the dashboard content to a signed-in user', async ({ page }) => {
    const user = makeTestUser('dashboard');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Job Application Tracker' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Planned MVP' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Current status' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('signing out clears the session and redirects to /login', async ({ page }) => {
    const user = makeTestUser('signout');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    // The session is valid before signing out.
    const meBefore = await page.request.get('/api/auth/me');
    expect(meBefore.status()).toBe(200);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/login');

    // The server no longer recognizes the session.
    const meAfter = await page.request.get('/api/auth/me');
    expect(meAfter.status()).toBe(401);

    // Revisiting the protected page bounces back to /login.
    await page.goto('/');
    await page.waitForURL('**/login');
  });
});
