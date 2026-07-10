import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { makeTestUser, signUpViaApi } from './helpers';

async function seedApplication(page: Page, data: Record<string, unknown>): Promise<void> {
  const response = await page.request.post('/api/applications', { data });
  expect(response.status()).toBe(201);
}

async function clickExportAndRead(page: Page): Promise<string> {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^applications-\d{4}-\d{2}-\d{2}\.csv$/);
  const path = await download.path();
  return fs.readFile(path, 'utf8');
}

test.describe('CSV export', () => {
  test('downloads a CSV containing the users applications with special characters intact', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('export'));

    await seedApplication(page, {
      company: 'Acme, "Quotes" & Co',
      roleTitle: 'Frontend Engineer',
      status: 'applied',
      appliedAt: '2026-07-01',
      jobUrl: 'https://acme.example.com/jobs/1'
    });
    await seedApplication(page, { company: 'Globex', roleTitle: 'Backend Engineer', status: 'offer' });

    await page.goto('/applications');
    await expect(page.getByRole('cell', { name: 'Globex' })).toBeVisible();

    const csv = await clickExportAndRead(page);

    expect(csv).toContain(
      'id,company_name,role_title,location,source,status,applied_at,job_url,priority,next_follow_up_at,notes_count,created_at'
    );
    // Special characters survive via RFC 4180 quoting.
    expect(csv).toContain('"Acme, ""Quotes"" & Co"');
    expect(csv).toContain('Frontend Engineer');
    expect(csv).toContain('2026-07-01');
    expect(csv).toContain('Globex');
  });

  test('export respects the active filters', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('export-filtered'));

    await seedApplication(page, { company: 'KeepCo', roleTitle: 'Kept Role', status: 'applied', appliedAt: '2026-07-01' });
    await seedApplication(page, { company: 'DropCo', roleTitle: 'Dropped Role', status: 'offer', appliedAt: '2026-07-02' });

    await page.goto('/applications');
    await expect(page.getByRole('cell', { name: 'KeepCo' })).toBeVisible();

    await page.getByLabel('Status').selectOption('applied');

    const csv = await clickExportAndRead(page);

    expect(csv).toContain('KeepCo');
    expect(csv).not.toContain('DropCo');
  });

  test('export of a fresh account yields only the header row', async ({ page }) => {
    await page.goto('/login');
    await signUpViaApi(page, makeTestUser('export-empty'));

    await page.goto('/applications');
    await expect(page.getByText('No applications yet. Create your first one!')).toBeVisible();

    const csv = await clickExportAndRead(page);
    const lines = csv.trim().split(/\r?\n/);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^id,company_name/);
  });

  test('export endpoint requires authentication', async ({ browser }) => {
    const context = await browser.newContext();
    const response = await context.request.get('http://localhost:3000/api/applications/export');
    expect(response.status()).toBe(401);
    await context.close();
  });
});
