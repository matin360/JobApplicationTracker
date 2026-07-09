import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { makeTestUser, signUpViaApi } from './helpers';

// Each test signs up a fresh user, so applications never leak between tests.
async function signUpAndOpenApplications(page: Page, label: string) {
  const user = makeTestUser(label);
  await page.goto('/login');
  await signUpViaApi(page, user);
  await page.goto('/applications');
  return user;
}

async function createApplicationViaUi(
  page: Page,
  fields: { company: string; roleTitle: string; status?: string; appliedAt?: string }
) {
  await page.getByRole('button', { name: 'New application' }).click();
  await expect(page).toHaveURL(/\/applications\/new$/);

  await page.getByLabel('Company').fill(fields.company);
  await page.getByLabel('Role title').fill(fields.roleTitle);
  if (fields.status) {
    await page.getByLabel('Status').selectOption(fields.status);
  }
  if (fields.appliedAt) {
    await page.getByLabel('Applied date').fill(fields.appliedAt);
  }
  await page.getByRole('button', { name: 'Create' }).click();

  // Creating lands on the new application's detail page.
  await page.waitForURL(/\/applications\/(?!new)[^/]+$/);
}

test.describe('applications CRUD', () => {
  test('empty state shows a friendly message', async ({ page }) => {
    await signUpAndOpenApplications(page, 'empty');

    await expect(page.getByText('No applications yet. Create your first one!')).toBeVisible();
  });

  test('create → list → detail → edit → delete round trip', async ({ page }) => {
    await signUpAndOpenApplications(page, 'crud');

    // Create
    await createApplicationViaUi(page, {
      company: 'Acme Corp',
      roleTitle: 'Frontend Engineer',
      status: 'applied',
      appliedAt: '2026-07-01'
    });
    await expect(page.getByRole('heading', { name: 'Frontend Engineer' })).toBeVisible();
    await expect(page.getByText('Acme Corp').first()).toBeVisible();

    // List shows it
    await page.getByRole('link', { name: '← Back to applications' }).click();
    await expect(page.getByRole('cell', { name: 'Acme Corp' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026-07-01' })).toBeVisible();

    // Open detail via the row link
    await page.getByRole('link', { name: 'Frontend Engineer' }).click();
    await expect(page.getByRole('heading', { name: 'Frontend Engineer' })).toBeVisible();

    // Edit: change status and role
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByLabel('Role title')).toHaveValue('Frontend Engineer');
    await page.getByLabel('Role title').fill('Senior Frontend Engineer');
    await page.getByLabel('Status').selectOption('offer');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeVisible();
    await expect(page.getByText('offer')).toBeVisible();

    // Changes persisted after a full reload
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeVisible();

    // Delete with confirmation
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm delete' }).click();

    await page.waitForURL(/\/applications$/);
    await expect(page.getByText('No applications yet. Create your first one!')).toBeVisible();
  });

  test('create form validates input', async ({ page }) => {
    await signUpAndOpenApplications(page, 'validation');

    await page.getByRole('button', { name: 'New application' }).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Role title is required.')).toBeVisible();

    await page.getByLabel('Role title').fill('Engineer');
    await page.getByLabel('Job URL').fill('not-a-url');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Job URL must be a valid http(s) URL.')).toBeVisible();
  });

  test('search and status filters narrow the list', async ({ page }) => {
    await signUpAndOpenApplications(page, 'filters');

    await createApplicationViaUi(page, { company: 'Acme', roleTitle: 'Frontend Engineer', status: 'applied' });
    await page.getByRole('link', { name: '← Back to applications' }).click();
    await createApplicationViaUi(page, { company: 'Globex', roleTitle: 'Backend Engineer', status: 'offer' });
    await page.getByRole('link', { name: '← Back to applications' }).click();

    // Search by company
    await page.getByLabel('Search').fill('globex');
    await expect(page.getByRole('cell', { name: 'Globex' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Acme', exact: true })).not.toBeVisible();
    await page.getByLabel('Search').fill('');

    // Filter by status
    await page.getByLabel('Status').selectOption('applied');
    await expect(page.getByRole('cell', { name: 'Acme', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Globex' })).not.toBeVisible();
  });

  test('sorting toggles when clicking a column header', async ({ page }) => {
    await signUpAndOpenApplications(page, 'sorting');

    await createApplicationViaUi(page, { company: 'Zeta', roleTitle: 'Z Role' });
    await page.getByRole('link', { name: '← Back to applications' }).click();
    await createApplicationViaUi(page, { company: 'Alpha', roleTitle: 'A Role' });
    await page.getByRole('link', { name: '← Back to applications' }).click();

    await page.getByRole('button', { name: 'Company' }).click();
    let firstRowLink = page.locator('tbody tr').first().getByRole('link').first();
    await expect(firstRowLink).toHaveText('Alpha');

    await page.getByRole('button', { name: /Company/ }).click();
    firstRowLink = page.locator('tbody tr').first().getByRole('link').first();
    await expect(firstRowLink).toHaveText('Zeta');
  });

  test('users cannot access other users applications', async ({ browser, page }) => {
    // User A creates an application.
    await signUpAndOpenApplications(page, 'owner');
    await createApplicationViaUi(page, { company: 'Secret Inc', roleTitle: 'Private Role' });
    const detailUrl = page.url();
    const applicationId = detailUrl.split('/').pop()!;

    // User B (fresh browser context) cannot fetch or view it.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    const otherUser = makeTestUser('intruder');
    await otherPage.goto('/login');
    await signUpViaApi(otherPage, otherUser);

    const apiResponse = await otherPage.request.get(`/api/applications/${applicationId}`);
    expect(apiResponse.status()).toBe(404);

    await otherPage.goto(`/applications/${applicationId}`);
    await expect(otherPage.getByText('Not found')).toBeVisible();

    // And user B's list is empty — no leakage.
    await otherPage.goto('/applications');
    await expect(otherPage.getByText('No applications yet. Create your first one!')).toBeVisible();

    await otherContext.close();
  });
});
