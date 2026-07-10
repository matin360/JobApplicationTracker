import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { makeTestUser, section, seedApplication, signUpViaApi } from './helpers';

// Sign up a fresh user, create an application via the API, and open its detail page.
async function openFreshDetailPage(page: Page, label: string): Promise<string> {
  const user = makeTestUser(label);
  await page.goto('/login');
  await signUpViaApi(page, user);

  const applicationId = await seedApplication(page, {
    company: 'Acme Corp',
    roleTitle: `Role ${label}`,
    status: 'interviewing'
  });

  await page.goto(`/applications/${applicationId}`);
  await expect(page.getByRole('heading', { name: `Role ${label}` })).toBeVisible();
  return applicationId;
}

test.describe('application detail workspace', () => {
  test('notes: add, edit, and delete', async ({ page }) => {
    await openFreshDetailPage(page, 'notes');
    const notes = section(page, 'Notes');

    // Add
    await notes.getByLabel('Add note').fill('Spoke with the recruiter today.');
    await notes.getByRole('button', { name: 'Add note' }).click();
    await expect(notes.getByText('Spoke with the recruiter today.')).toBeVisible();

    // Edit
    await notes.getByRole('button', { name: 'Edit' }).click();
    await notes.getByLabel('Edit note').fill('Updated recruiter conversation.');
    await notes.getByRole('button', { name: 'Save note' }).click();
    await expect(notes.getByText('Updated recruiter conversation.')).toBeVisible();
    await expect(notes.getByText('Spoke with the recruiter today.')).not.toBeVisible();

    // Persists after reload
    await page.reload();
    await expect(section(page, 'Notes').getByText('Updated recruiter conversation.')).toBeVisible();

    // Delete
    await section(page, 'Notes').getByRole('button', { name: 'Delete' }).click();
    await expect(section(page, 'Notes').getByText('No notes yet.')).toBeVisible();
  });

  test('reminders: add, complete, reopen, and delete', async ({ page }) => {
    await openFreshDetailPage(page, 'reminders');
    const reminders = section(page, 'Reminders');

    // Add
    await reminders.getByLabel('Reminder', { exact: true }).fill('Send thank-you email');
    await reminders.getByLabel('Due date').fill('2099-12-31');
    await reminders.getByRole('button', { name: 'Add reminder' }).click();
    await expect(reminders.getByText('Send thank-you email')).toBeVisible();
    await expect(reminders.getByText('active')).toBeVisible();

    // Complete
    await reminders.getByRole('button', { name: 'Complete' }).click();
    await expect(reminders.getByText('done')).toBeVisible();
    await expect(reminders.getByRole('button', { name: 'Reopen' })).toBeVisible();

    // Reopen
    await reminders.getByRole('button', { name: 'Reopen' }).click();
    await expect(reminders.getByText('active')).toBeVisible();

    // Delete
    await reminders.getByRole('button', { name: 'Delete' }).click();
    await expect(reminders.getByText('No reminders yet.')).toBeVisible();
  });

  test('interviews: add with stage and date, edit, timeline updates', async ({ page }) => {
    await openFreshDetailPage(page, 'interviews');
    const interviews = section(page, 'Interviews');

    // Add
    await interviews.getByLabel('Stage', { exact: true }).fill('Phone screen');
    await interviews.getByLabel('Date and time').fill('2026-08-01T14:00');
    await interviews.getByLabel('Interview notes').fill('With the hiring manager.');
    await interviews.getByRole('button', { name: 'Add interview' }).click();
    await expect(interviews.getByText('Phone screen')).toBeVisible();
    await expect(interviews.getByText('With the hiring manager.')).toBeVisible();

    // Timeline reflects it
    await expect(section(page, 'Activity').getByText('Interview added: Phone screen')).toBeVisible();

    // Edit
    await interviews.getByRole('button', { name: 'Edit' }).click();
    await interviews.getByLabel('Edit stage').fill('Onsite');
    await interviews.getByRole('button', { name: 'Save interview' }).click();
    await expect(interviews.getByText('Onsite')).toBeVisible();

    // Persists after reload
    await page.reload();
    await expect(section(page, 'Interviews').getByText('Onsite')).toBeVisible();
  });

  test('activity timeline shows application and child events', async ({ page }) => {
    const applicationId = await openFreshDetailPage(page, 'timeline');

    // Seed children through the API for speed.
    await page.request.post(`/api/applications/${applicationId}/notes`, { data: { content: 'A note' } });
    await page.request.post(`/api/applications/${applicationId}/reminders`, {
      data: { title: 'Check in', dueAt: '2099-01-01' }
    });

    await page.reload();

    const activity = section(page, 'Activity');
    await expect(activity.getByText('Application created')).toBeVisible();
    await expect(activity.getByText('Note added')).toBeVisible();
    await expect(activity.getByText('Reminder added: Check in')).toBeVisible();
  });

  test('children are protected by ownership', async ({ browser, page }) => {
    const applicationId = await openFreshDetailPage(page, 'child-owner');

    const noteResponse = await page.request.post(`/api/applications/${applicationId}/notes`, {
      data: { content: 'Private note' }
    });
    const { note } = (await noteResponse.json()) as { note: { id: string } };

    // Another user cannot add to or modify children of this application.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await otherPage.goto('/login');
    await signUpViaApi(otherPage, makeTestUser('child-intruder'));

    const addAttempt = await otherPage.request.post(`/api/applications/${applicationId}/notes`, {
      data: { content: 'Injected' }
    });
    expect(addAttempt.status()).toBe(404);

    const editAttempt = await otherPage.request.patch(`/api/notes/${note.id}`, {
      data: { content: 'Hijacked' }
    });
    expect(editAttempt.status()).toBe(404);

    await otherContext.close();
  });
});
