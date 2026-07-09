import { expect, test } from '@playwright/test';
import { makeTestUser, signUpViaApi } from './helpers';

test.describe('navigation', () => {
  test('navigates between dashboard, applications, and settings via the nav', async ({ page }) => {
    const user = makeTestUser('nav');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/dashboard');

    await page.getByRole('link', { name: 'Applications' }).click();
    await expect(page).toHaveURL(/\/applications$/);
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Acme Corp' })).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue(user.email);

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('highlights the active page in the nav', async ({ page }) => {
    const user = makeTestUser('nav-active');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/applications');

    await expect(page.getByRole('link', { name: 'Applications' })).toHaveClass(/active/);
    await expect(page.getByRole('link', { name: 'Dashboard' })).not.toHaveClass(/active/);
  });

  test('brand link returns to the dashboard', async ({ page }) => {
    const user = makeTestUser('brand');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/settings');
    await page.getByRole('link', { name: 'Job Application Tracker' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('mobile: nav is collapsed behind the hamburger and works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const user = makeTestUser('mobile');
    await page.goto('/login');
    await signUpViaApi(page, user);

    await page.goto('/dashboard');

    // Nav links are hidden until the hamburger is tapped.
    const applicationsLink = page.getByRole('link', { name: 'Applications' });
    await expect(applicationsLink).not.toBeVisible();

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(applicationsLink).toBeVisible();

    await applicationsLink.click();
    await expect(page).toHaveURL(/\/applications$/);
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();

    // The nav closes itself after navigating.
    await expect(page.getByRole('link', { name: 'Dashboard' })).not.toBeVisible();
  });
});
