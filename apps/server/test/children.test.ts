import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import {
  createInterview,
  createNote,
  createReminder,
  deleteNote,
  updateInterview,
  updateNote,
  updateReminder
} from '../src/children';
import { getApplication } from '../src/applications';
import { requireNoteOwnership } from '../src/authorization';
import type { AuthUser } from '../src/auth';

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

async function createFixture(label: string): Promise<{ user: AuthUser; applicationId: string }> {
  const user = await prisma.user.create({
    data: {
      email: `children-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: `Children ${label}`
    }
  });
  const application = await prisma.application.create({
    data: { userId: user.id, roleTitle: `Role for ${label}` }
  });
  return { user: { id: user.id, email: user.email, name: user.name }, applicationId: application.id };
}

test('notes CRUD: create, edit, delete, and validation', async () => {
  const { user, applicationId } = await createFixture('notes');

  try {
    // Missing content rejected
    const invalid = makeResponse();
    await createNote(makeRequest(user, { params: { applicationId }, body: {} }), invalid);
    assert.equal(invalid.statusCode, 400);

    // Over-length content rejected
    const tooLong = makeResponse();
    await createNote(
      makeRequest(user, { params: { applicationId }, body: { content: 'x'.repeat(5001) } }),
      tooLong
    );
    assert.equal(tooLong.statusCode, 400);

    // Create
    const created = makeResponse();
    await createNote(
      makeRequest(user, { params: { applicationId }, body: { content: 'Spoke with recruiter.' } }),
      created
    );
    assert.equal(created.statusCode, 201);
    const noteId = (created.body as { note: { id: string } }).note.id;

    // Edit
    const updated = makeResponse();
    await updateNote(
      makeRequest(user, { params: { noteId }, body: { content: 'Updated note.' } }),
      updated
    );
    assert.equal((updated.body as { note: { content: string } }).note.content, 'Updated note.');

    // Delete
    const deleted = makeResponse();
    await deleteNote(makeRequest(user, { params: { noteId } }), deleted);
    assert.equal(deleted.statusCode, 204);
    assert.equal(await prisma.note.count({ where: { applicationId } }), 0);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('reminders CRUD: create, complete, reopen, and validation', async () => {
  const { user, applicationId } = await createFixture('reminders');

  try {
    // Missing due date rejected
    const invalid = makeResponse();
    await createReminder(makeRequest(user, { params: { applicationId }, body: { title: 'Follow up' } }), invalid);
    assert.equal(invalid.statusCode, 400);

    // Create
    const created = makeResponse();
    await createReminder(
      makeRequest(user, { params: { applicationId }, body: { title: 'Follow up', dueAt: '2026-07-20' } }),
      created
    );
    assert.equal(created.statusCode, 201);
    const reminder = (created.body as { reminder: { id: string; completedAt: string | null } }).reminder;
    assert.equal(reminder.completedAt, null);

    // Complete
    const completed = makeResponse();
    await updateReminder(
      makeRequest(user, { params: { reminderId: reminder.id }, body: { completed: true } }),
      completed
    );
    assert.notEqual((completed.body as { reminder: { completedAt: string | null } }).reminder.completedAt, null);

    // Reopen
    const reopened = makeResponse();
    await updateReminder(
      makeRequest(user, { params: { reminderId: reminder.id }, body: { completed: false } }),
      reopened
    );
    assert.equal((reopened.body as { reminder: { completedAt: string | null } }).reminder.completedAt, null);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('interviews CRUD: create with stage/date/notes and edit', async () => {
  const { user, applicationId } = await createFixture('interviews');

  try {
    // Missing stage rejected
    const invalid = makeResponse();
    await createInterview(makeRequest(user, { params: { applicationId }, body: {} }), invalid);
    assert.equal(invalid.statusCode, 400);

    // Create
    const created = makeResponse();
    await createInterview(
      makeRequest(user, {
        params: { applicationId },
        body: { stage: 'Phone screen', scheduledAt: '2026-07-10T14:00:00Z', notes: 'With hiring manager' }
      }),
      created
    );
    assert.equal(created.statusCode, 201);
    const interview = (created.body as { interview: { id: string; stage: string } }).interview;
    assert.equal(interview.stage, 'Phone screen');

    // Edit stage and clear the date
    const updated = makeResponse();
    await updateInterview(
      makeRequest(user, { params: { interviewId: interview.id }, body: { stage: 'Onsite', scheduledAt: null } }),
      updated
    );
    const updatedInterview = (updated.body as { interview: { stage: string; scheduledAt: string | null } }).interview;
    assert.equal(updatedInterview.stage, 'Onsite');
    assert.equal(updatedInterview.scheduledAt, null);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('application detail includes children ordered for the workspace', async () => {
  const { user, applicationId } = await createFixture('detail');

  try {
    await prisma.note.create({ data: { applicationId, content: 'A note' } });
    await prisma.reminder.create({ data: { applicationId, title: 'Later', dueAt: new Date('2026-08-01') } });
    await prisma.reminder.create({ data: { applicationId, title: 'Sooner', dueAt: new Date('2026-07-01') } });
    await prisma.interview.create({ data: { applicationId, stage: 'Phone screen' } });

    const response = makeResponse();
    await getApplication(makeRequest(user, { params: { applicationId } }), response);

    const application = (response.body as {
      application: { notes: unknown[]; reminders: { title: string }[]; interviews: { stage: string }[] };
    }).application;

    assert.equal(application.notes.length, 1);
    assert.equal(application.interviews[0].stage, 'Phone screen');
    // Reminders come back ordered by due date ascending.
    assert.deepEqual(
      application.reminders.map((reminder) => reminder.title),
      ['Sooner', 'Later']
    );
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test('note ownership middleware blocks other users', async () => {
  const ownerFixture = await createFixture('note-owner');
  const intruderFixture = await createFixture('note-intruder');

  try {
    const note = await prisma.note.create({
      data: { applicationId: ownerFixture.applicationId, content: 'Private' }
    });

    const middleware = requireNoteOwnership();

    const blocked = makeResponse();
    let blockedNext = false;
    await middleware(
      makeRequest(intruderFixture.user, { params: { noteId: note.id } }),
      blocked,
      () => {
        blockedNext = true;
      }
    );
    assert.equal(blocked.statusCode, 404);
    assert.equal(blockedNext, false);

    const allowed = makeResponse();
    let allowedNext = false;
    await middleware(
      makeRequest(ownerFixture.user, { params: { noteId: note.id } }),
      allowed,
      () => {
        allowedNext = true;
      }
    );
    assert.equal(allowedNext, true);
  } finally {
    await prisma.user.delete({ where: { id: ownerFixture.user.id } });
    await prisma.user.delete({ where: { id: intruderFixture.user.id } });
  }
});
