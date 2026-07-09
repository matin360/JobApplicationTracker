import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication
} from './applications';
import { requireApplicationOwnership } from './authorization';
import type { AuthUser } from './auth';

const prisma = new PrismaClient();

interface FakeResponse extends Response {
  statusCode: number;
  body: unknown;
  ended: boolean;
}

function makeResponse(): FakeResponse {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    ended: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    },
    send() {
      this.ended = true;
    }
  };
  return response as unknown as FakeResponse;
}

function makeRequest(user: AuthUser, options: { body?: unknown; params?: Record<string, string> } = {}): Request {
  return {
    user,
    body: options.body ?? {},
    params: options.params ?? {}
  } as unknown as Request;
}

async function createTestUser(label: string): Promise<AuthUser> {
  const user = await prisma.user.create({
    data: {
      email: `applications-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: `Applications ${label}`
    }
  });
  return { id: user.id, email: user.email, name: user.name };
}

test('applications CRUD round trip persists and serializes correctly', async () => {
  const user = await createTestUser('crud');

  try {
    // Create
    const createResponse = makeResponse();
    await createApplication(
      makeRequest(user, {
        body: {
          company: 'Acme Corp',
          roleTitle: 'Frontend Engineer',
          location: 'Remote',
          source: 'LinkedIn',
          status: 'applied',
          appliedAt: '2026-07-01',
          jobUrl: 'https://acme.example.com/jobs/1',
          priority: 'high',
          nextFollowUpAt: '2026-07-15'
        }
      }),
      createResponse
    );

    assert.equal(createResponse.statusCode, 201);
    const created = (createResponse.body as { application: { id: string; company: { name: string } | null; status: string } }).application;
    assert.equal(created.company?.name, 'Acme Corp');
    assert.equal(created.status, 'applied');

    // List contains it
    const listResponse = makeResponse();
    await listApplications(makeRequest(user), listResponse);
    const listed = (listResponse.body as { applications: { id: string }[] }).applications;
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, created.id);

    // Get detail
    const getResponse = makeResponse();
    await getApplication(makeRequest(user, { params: { applicationId: created.id } }), getResponse);
    const fetched = (getResponse.body as { application: { roleTitle: string; jobUrl: string } }).application;
    assert.equal(fetched.roleTitle, 'Frontend Engineer');
    assert.equal(fetched.jobUrl, 'https://acme.example.com/jobs/1');

    // Update: change status, clear company
    const updateResponse = makeResponse();
    await updateApplication(
      makeRequest(user, {
        params: { applicationId: created.id },
        body: { status: 'offer', company: null }
      }),
      updateResponse
    );
    const updated = (updateResponse.body as { application: { status: string; company: unknown } }).application;
    assert.equal(updated.status, 'offer');
    assert.equal(updated.company, null);

    // Delete
    const deleteResponse = makeResponse();
    await deleteApplication(makeRequest(user, { params: { applicationId: created.id } }), deleteResponse);
    assert.equal(deleteResponse.statusCode, 204);
    assert.equal(deleteResponse.ended, true);

    const remaining = await prisma.application.count({ where: { userId: user.id } });
    assert.equal(remaining, 0);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('createApplication validates input', async () => {
  const user = await createTestUser('validation');

  try {
    const cases: { body: Record<string, unknown>; expectedError: RegExp }[] = [
      { body: {}, expectedError: /Role title is required/ },
      { body: { roleTitle: '   ' }, expectedError: /Role title is required/ },
      { body: { roleTitle: 'Dev', status: 'ghosted' }, expectedError: /Status must be one of/ },
      { body: { roleTitle: 'Dev', priority: 'urgent' }, expectedError: /Priority must be one of/ },
      { body: { roleTitle: 'Dev', jobUrl: 'not-a-url' }, expectedError: /Job URL must be a valid/ },
      { body: { roleTitle: 'Dev', jobUrl: 'ftp://x.com' }, expectedError: /Job URL must be a valid/ },
      { body: { roleTitle: 'Dev', appliedAt: 'yesterday-ish' }, expectedError: /Applied date must be a valid date/ }
    ];

    for (const testCase of cases) {
      const response = makeResponse();
      await createApplication(makeRequest(user, { body: testCase.body }), response);
      assert.equal(response.statusCode, 400, JSON.stringify(testCase.body));
      assert.match((response.body as { error: string }).error, testCase.expectedError);
    }

    // Minimal valid body applies defaults.
    const response = makeResponse();
    await createApplication(makeRequest(user, { body: { roleTitle: 'Dev' } }), response);
    assert.equal(response.statusCode, 201);
    const application = (response.body as { application: { status: string; priority: string; company: unknown } }).application;
    assert.equal(application.status, 'saved');
    assert.equal(application.priority, 'medium');
    assert.equal(application.company, null);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('creating applications reuses an existing company with the same name', async () => {
  const user = await createTestUser('company-reuse');

  try {
    for (let i = 0; i < 2; i += 1) {
      const response = makeResponse();
      await createApplication(makeRequest(user, { body: { roleTitle: `Role ${i}`, company: 'Globex' } }), response);
      assert.equal(response.statusCode, 201);
    }

    const companies = await prisma.company.count({ where: { userId: user.id, name: 'Globex' } });
    assert.equal(companies, 1);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('ownership middleware hides other users applications', async () => {
  const owner = await createTestUser('owner');
  const intruder = await createTestUser('intruder');

  try {
    const createResponse = makeResponse();
    await createApplication(makeRequest(owner, { body: { roleTitle: 'Private role' } }), createResponse);
    const applicationId = (createResponse.body as { application: { id: string } }).application.id;

    const middleware = requireApplicationOwnership();

    // The intruder gets a 404 and the handler chain stops.
    const intruderResponse = makeResponse();
    let intruderNextCalled = false;
    await middleware(
      makeRequest(intruder, { params: { applicationId } }),
      intruderResponse,
      () => {
        intruderNextCalled = true;
      }
    );
    assert.equal(intruderResponse.statusCode, 404);
    assert.equal(intruderNextCalled, false);

    // The owner passes through.
    const ownerResponse = makeResponse();
    let ownerNextCalled = false;
    await middleware(
      makeRequest(owner, { params: { applicationId } }),
      ownerResponse,
      () => {
        ownerNextCalled = true;
      }
    );
    assert.equal(ownerNextCalled, true);
  } finally {
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.user.delete({ where: { id: intruder.id } });
  }
});
