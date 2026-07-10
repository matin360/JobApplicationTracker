import { expect, test } from '@playwright/test';
import { makeTestUser, section, seedApplication, signUpViaApi } from './helpers';

test.describe('dashboard', () => {
  test('shows status counts, chart, upcoming reminders, and recent applications', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('dashboard-full'));

    // Seed: 2 applied, 1 interviewing; one upcoming and one distant reminder.
    const app1 = await seedApplication(page, { company: 'Acme', roleTitle: 'Frontend Engineer', status: 'applied', appliedAt: '2026-07-01' });
    await seedApplication(page, { company: 'Globex', roleTitle: 'Backend Engineer', status: 'applied' });
    await seedApplication(page, { company: 'Initech', roleTitle: 'Designer', status: 'interviewing' });

    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.request.post(`/api/applications/${app1}/reminders`, { data: { title: 'Follow up soon', dueAt: soon } });
    await page.request.post(`/api/applications/${app1}/reminders`, { data: { title: 'Far away', dueAt: '2099-01-01' } });

    await page.goto('/dashboard');

    // Status cards.
    const appliedCard = page.locator('.stat-card', { hasText: 'applied' }).first();
    await expect(appliedCard).toContainText('2');
    const interviewingCard = page.locator('.stat-card', { hasText: 'interviewing' }).first();
    await expect(interviewingCard).toContainText('1');

    // Chart renders with accessible name.
    await expect(page.getByRole('img', { name: 'Applications by status' })).toBeVisible();

    // Upcoming reminders: only the one due soon, linked to its application.
    const reminders = section(page, 'Upcoming reminders');
    await expect(reminders.getByText('Follow up soon')).toBeVisible();
    await expect(reminders.getByText('Far away')).not.toBeVisible();
    await expect(reminders.getByRole('link', { name: 'Frontend Engineer at Acme' })).toBeVisible();
    await expect(reminders.getByText('2 active reminders in total.')).toBeVisible();

    // Recent applications table links to detail pages.
    const recent = section(page, 'Recent applications');
    await expect(recent.getByRole('cell', { name: 'Initech' })).toBeVisible();
    await recent.getByRole('link', { name: 'Frontend Engineer' }).click();
    await expect(page).toHaveURL(new RegExp(`/applications/${app1}$`));
  });

  test('completing a reminder from the dashboard updates the summary', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('dashboard-complete'));

    const appId = await seedApplication(page, { roleTitle: 'Role', status: 'applied' });
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.request.post(`/api/applications/${appId}/reminders`, { data: { title: 'Do the thing', dueAt: soon } });

    await page.goto('/dashboard');

    const reminders = section(page, 'Upcoming reminders');
    await expect(reminders.getByText('Do the thing')).toBeVisible();

    await reminders.getByRole('button', { name: 'Complete' }).click();

    await expect(reminders.getByText('Nothing due in the next 7 days.')).toBeVisible();
    await expect(reminders.getByText('0 active reminders in total.')).toBeVisible();
  });

  test('shows friendly empty states for a fresh account', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('dashboard-empty'));

    await page.goto('/dashboard');

    await expect(page.getByText('Nothing due in the next 7 days.')).toBeVisible();
    await expect(page.getByText('No applications yet — the chart will fill in as you add them.')).toBeVisible();
    await expect(section(page, 'Recent applications').getByRole('link', { name: 'Create your first one' })).toBeVisible();
  });

  test('date-range filter narrows the applications list', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('date-filter'));

    await seedApplication(page, { company: 'OldCo', roleTitle: 'Old Role', status: 'applied', appliedAt: '2026-01-15' });
    await seedApplication(page, { company: 'NewCo', roleTitle: 'New Role', status: 'applied', appliedAt: '2026-07-01' });

    await page.goto('/applications');
    await expect(page.getByRole('cell', { name: 'OldCo' })).toBeVisible();

    await page.getByLabel('Applied from').fill('2026-06-01');
    await expect(page.getByRole('cell', { name: 'NewCo' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'OldCo' })).not.toBeVisible();

    await page.getByLabel('Applied to').fill('2026-06-30');
    await expect(page.getByText('No applications match your filters.')).toBeVisible();
  });
});
