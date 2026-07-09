import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import { getDashboardSummary } from '../src/dashboard';
import type { AuthUser } from '../src/auth';

const prisma = new PrismaClient();

interface FakeResponse extends Response {
  statusCode: number;
  body: unknown;
}

function makeResponse(): FakeResponse {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    }
  };
  return response as unknown as FakeResponse;
}

interface SummaryBody {
  statusCounts: Record<string, number>;
  reminders: {
    active: number;
    upcoming: number;
    upcomingList: { title: string; application: { roleTitle: string; companyName: string | null } }[];
  };
  recentApplications: { roleTitle: string; companyName: string | null }[];
}

test('dashboard summary aggregates only the current users data', async () => {
  const user = await prisma.user.create({
    data: { email: `dashboard-${Date.now()}@example.com`, name: 'Dashboard Tester' }
  });
  const otherUser = await prisma.user.create({
    data: { email: `dashboard-other-${Date.now()}@example.com`, name: 'Other' }
  });

  try {
    const company = await prisma.company.create({ data: { userId: user.id, name: 'Acme' } });

    // Two applied + one offer for our user.
    const app1 = await prisma.application.create({
      data: { userId: user.id, companyId: company.id, roleTitle: 'Role A', status: 'applied' }
    });
    await prisma.application.create({ data: { userId: user.id, roleTitle: 'Role B', status: 'applied' } });
    await prisma.application.create({ data: { userId: user.id, roleTitle: 'Role C', status: 'offer' } });

    // Noise from another user that must not leak in.
    await prisma.application.create({ data: { userId: otherUser.id, roleTitle: 'Foreign', status: 'applied' } });

    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    // Upcoming (within 7 days), distant (active but not upcoming), completed (neither).
    await prisma.reminder.create({ data: { applicationId: app1.id, title: 'Soon', dueAt: soon } });
    await prisma.reminder.create({ data: { applicationId: app1.id, title: 'Far', dueAt: far } });
    await prisma.reminder.create({
      data: { applicationId: app1.id, title: 'Done', dueAt: soon, completedAt: new Date() }
    });

    const authUser: AuthUser = { id: user.id, email: user.email, name: user.name };
    const response = makeResponse();
    await getDashboardSummary({ user: authUser } as unknown as Request, response);

    const body = response.body as SummaryBody;

    assert.equal(body.statusCounts.applied, 2);
    assert.equal(body.statusCounts.offer, 1);
    assert.equal(body.statusCounts.saved, 0);
    assert.equal(body.statusCounts.withdrawn, 0);

    assert.equal(body.reminders.active, 2);
    assert.equal(body.reminders.upcoming, 1);
    assert.equal(body.reminders.upcomingList.length, 1);
    assert.equal(body.reminders.upcomingList[0].title, 'Soon');
    assert.equal(body.reminders.upcomingList[0].application.companyName, 'Acme');

    assert.equal(body.recentApplications.length, 3);
    // Newest first.
    assert.equal(body.recentApplications[0].roleTitle, 'Role C');
    assert.ok(!body.recentApplications.some((application) => application.roleTitle === 'Foreign'));
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  }
});
