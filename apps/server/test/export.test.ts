import test from 'node:test';
import assert from 'node:assert/strict';

import { exportApplicationsCsv } from '../src/export';
import { prisma } from '../src/prisma';
import { createTestUser, makeRequest, makeResponse, parseCsv } from './helpers';

test('export produces a correct CSV row with all fields and escaping', async () => {
  const user = await createTestUser('rows');

  try {
    const company = await prisma.company.create({
      data: { userId: user.id, name: 'Acme, "Quotes" & Co' }
    });
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        companyId: company.id,
        roleTitle: 'Engineer\nMultiline',
        location: 'Remote',
        source: 'LinkedIn',
        status: 'applied',
        appliedAt: new Date('2026-07-01T00:00:00Z'),
        jobUrl: 'https://acme.example.com/jobs/1',
        priority: 'high',
        nextFollowUpAt: new Date('2026-07-15T00:00:00Z')
      }
    });
    await prisma.note.create({ data: { applicationId: application.id, content: 'note one' } });
    await prisma.note.create({ data: { applicationId: application.id, content: 'note two' } });

    const response = makeResponse();
    await exportApplicationsCsv(makeRequest(user), response);

    assert.equal(response.statusCode, 200);
    assert.match(response.headers['Content-Type'], /text\/csv/);
    assert.match(response.headers['Content-Disposition'], /attachment; filename="applications-\d{4}-\d{2}-\d{2}\.csv"/);

    const rows = parseCsv(response.sent!);
    assert.deepEqual(rows[0], [
      'id',
      'company_name',
      'role_title',
      'location',
      'source',
      'status',
      'applied_at',
      'job_url',
      'priority',
      'next_follow_up_at',
      'notes_count',
      'created_at'
    ]);

    assert.equal(rows.length, 2);
    const row = rows[1];
    assert.equal(row[0], application.id);
    assert.equal(row[1], 'Acme, "Quotes" & Co');
    assert.equal(row[2], 'Engineer\nMultiline');
    assert.equal(row[5], 'applied');
    assert.equal(row[6], '2026-07-01');
    assert.equal(row[9], '2026-07-15');
    assert.equal(row[10], '2');
    assert.match(row[11], /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('export only includes the current users applications', async () => {
  const user = await createTestUser('scope');
  const other = await createTestUser('scope-other');

  try {
    await prisma.application.create({ data: { userId: user.id, roleTitle: 'Mine' } });
    await prisma.application.create({ data: { userId: other.id, roleTitle: 'Theirs' } });

    const response = makeResponse();
    await exportApplicationsCsv(makeRequest(user), response);

    assert.match(response.sent!, /Mine/);
    assert.doesNotMatch(response.sent!, /Theirs/);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.user.delete({ where: { id: other.id } });
  }
});

test('export applies status and date-range filters', async () => {
  const user = await createTestUser('filters');

  try {
    await prisma.application.create({
      data: { userId: user.id, roleTitle: 'AppliedJune', status: 'applied', appliedAt: new Date('2026-06-15') }
    });
    await prisma.application.create({
      data: { userId: user.id, roleTitle: 'AppliedJuly', status: 'applied', appliedAt: new Date('2026-07-05') }
    });
    await prisma.application.create({
      data: { userId: user.id, roleTitle: 'OfferJuly', status: 'offer', appliedAt: new Date('2026-07-06') }
    });
    await prisma.application.create({ data: { userId: user.id, roleTitle: 'NoDate', status: 'applied' } });

    // Status filter (multi-value).
    let response = makeResponse();
    await exportApplicationsCsv(makeRequest(user, { query: { status: 'applied' }}), response);
    assert.match(response.sent!, /AppliedJune/);
    assert.match(response.sent!, /NoDate/);
    assert.doesNotMatch(response.sent!, /OfferJuly/);

    // Date range: July only; rows without applied date drop out.
    response = makeResponse();
    await exportApplicationsCsv(makeRequest(user, { query: { from: '2026-07-01', to: '2026-07-31' }}), response);
    assert.match(response.sent!, /AppliedJuly/);
    assert.match(response.sent!, /OfferJuly/);
    assert.doesNotMatch(response.sent!, /AppliedJune/);
    assert.doesNotMatch(response.sent!, /NoDate/);

    // Combined.
    response = makeResponse();
    await exportApplicationsCsv(makeRequest(user, { query: { status: 'offer', from: '2026-07-01' }}), response);
    assert.match(response.sent!, /OfferJuly/);
    assert.doesNotMatch(response.sent!, /AppliedJuly/);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('export rejects invalid filters with 400', async () => {
  const user = await createTestUser('invalid');

  try {
    let response = makeResponse();
    await exportApplicationsCsv(makeRequest(user, { query: { status: 'applied,ghosted' }}), response);
    assert.equal(response.statusCode, 400);
    assert.match((response.body as { error: string }).error, /ghosted/);

    response = makeResponse();
    await exportApplicationsCsv(makeRequest(user, { query: { from: 'not-a-date' }}), response);
    assert.equal(response.statusCode, 400);

    response = makeResponse();
    await exportApplicationsCsv(makeRequest(user, { query: { to: '2026-99-99' }}), response);
    assert.equal(response.statusCode, 400);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});
