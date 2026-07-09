import { PrismaClient } from '@prisma/client';
import type { Note, Reminder, Interview } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

// Child records of an application: notes, reminders, and interviews.
// Route-level ownership middleware has already verified access, so handlers
// only validate input and touch the database.

export function serializeNote(note: Note) {
  return {
    id: note.id,
    applicationId: note.applicationId,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString()
  };
}

export function serializeReminder(reminder: Reminder) {
  return {
    id: reminder.id,
    applicationId: reminder.applicationId,
    title: reminder.title,
    dueAt: reminder.dueAt.toISOString(),
    completedAt: reminder.completedAt?.toISOString() ?? null,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString()
  };
}

export function serializeInterview(interview: Interview) {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    stage: interview.stage,
    scheduledAt: interview.scheduledAt?.toISOString() ?? null,
    notes: interview.notes,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString()
  };
}

const MAX_NOTE_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;
const MAX_STAGE_LENGTH = 100;

function readOptionalString(input: Record<string, unknown>, name: string): string | null | undefined {
  if (!(name in input)) {
    return undefined;
  }
  const value = input[name];
  if (value === null || value === '') {
    return null;
  }
  return typeof value === 'string' ? value.trim() : undefined;
}

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ---------- Notes ----------

function validateNoteContent(input: Record<string, unknown>): { error: string } | { content: string } {
  const content = readOptionalString(input, 'content');
  if (!content) {
    return { error: 'Note content is required.' };
  }
  if (content.length > MAX_NOTE_LENGTH) {
    return { error: `Note content must be ${MAX_NOTE_LENGTH} characters or fewer.` };
  }
  return { content };
}

export async function createNote(request: Request, response: Response): Promise<void> {
  const result = validateNoteContent((request.body ?? {}) as Record<string, unknown>);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const note = await prisma.note.create({
    data: { applicationId: String(request.params.applicationId), content: result.content }
  });
  response.status(201).json({ note: serializeNote(note) });
}

export async function updateNote(request: Request, response: Response): Promise<void> {
  const result = validateNoteContent((request.body ?? {}) as Record<string, unknown>);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const note = await prisma.note.update({
    where: { id: String(request.params.noteId) },
    data: { content: result.content }
  });
  response.json({ note: serializeNote(note) });
}

export async function deleteNote(request: Request, response: Response): Promise<void> {
  await prisma.note.delete({ where: { id: String(request.params.noteId) } });
  response.status(204).send();
}

// ---------- Reminders ----------

interface ReminderFields {
  title?: string;
  dueAt?: Date;
  completedAt?: Date | null;
}

function validateReminderBody(body: unknown, partial: boolean): { error: string } | { fields: ReminderFields } {
  const input = (body ?? {}) as Record<string, unknown>;
  const fields: ReminderFields = {};

  if ('title' in input) {
    const title = readOptionalString(input, 'title');
    if (!title) {
      return { error: 'Reminder title is required.' };
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return { error: `Reminder title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
    }
    fields.title = title;
  } else if (!partial) {
    return { error: 'Reminder title is required.' };
  }

  if ('dueAt' in input) {
    const raw = readOptionalString(input, 'dueAt');
    const dueAt = raw ? parseDate(raw) : null;
    if (!dueAt) {
      return { error: 'Reminder due date must be a valid date.' };
    }
    fields.dueAt = dueAt;
  } else if (!partial) {
    return { error: 'Reminder due date is required.' };
  }

  if ('completed' in input) {
    if (typeof input.completed !== 'boolean') {
      return { error: 'Completed must be a boolean.' };
    }
    fields.completedAt = input.completed ? new Date() : null;
  }

  return { fields };
}

export async function createReminder(request: Request, response: Response): Promise<void> {
  const result = validateReminderBody(request.body, false);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const reminder = await prisma.reminder.create({
    data: {
      applicationId: String(request.params.applicationId),
      title: result.fields.title!,
      dueAt: result.fields.dueAt!,
      completedAt: result.fields.completedAt ?? null
    }
  });
  response.status(201).json({ reminder: serializeReminder(reminder) });
}

export async function updateReminder(request: Request, response: Response): Promise<void> {
  const result = validateReminderBody(request.body, true);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const reminder = await prisma.reminder.update({
    where: { id: String(request.params.reminderId) },
    data: result.fields
  });
  response.json({ reminder: serializeReminder(reminder) });
}

export async function deleteReminder(request: Request, response: Response): Promise<void> {
  await prisma.reminder.delete({ where: { id: String(request.params.reminderId) } });
  response.status(204).send();
}

// ---------- Interviews ----------

interface InterviewFields {
  stage?: string;
  scheduledAt?: Date | null;
  notes?: string | null;
}

function validateInterviewBody(body: unknown, partial: boolean): { error: string } | { fields: InterviewFields } {
  const input = (body ?? {}) as Record<string, unknown>;
  const fields: InterviewFields = {};

  if ('stage' in input) {
    const stage = readOptionalString(input, 'stage');
    if (!stage) {
      return { error: 'Interview stage is required.' };
    }
    if (stage.length > MAX_STAGE_LENGTH) {
      return { error: `Interview stage must be ${MAX_STAGE_LENGTH} characters or fewer.` };
    }
    fields.stage = stage;
  } else if (!partial) {
    return { error: 'Interview stage is required.' };
  }

  if ('scheduledAt' in input) {
    const raw = readOptionalString(input, 'scheduledAt');
    if (raw === undefined) {
      return { error: 'Interview date must be a string.' };
    }
    if (raw === null) {
      fields.scheduledAt = null;
    } else {
      const scheduledAt = parseDate(raw);
      if (!scheduledAt) {
        return { error: 'Interview date must be a valid date.' };
      }
      fields.scheduledAt = scheduledAt;
    }
  }

  if ('notes' in input) {
    const notes = readOptionalString(input, 'notes');
    if (notes === undefined) {
      return { error: 'Interview notes must be a string.' };
    }
    if (notes && notes.length > MAX_NOTE_LENGTH) {
      return { error: `Interview notes must be ${MAX_NOTE_LENGTH} characters or fewer.` };
    }
    fields.notes = notes;
  }

  return { fields };
}

export async function createInterview(request: Request, response: Response): Promise<void> {
  const result = validateInterviewBody(request.body, false);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const interview = await prisma.interview.create({
    data: {
      applicationId: String(request.params.applicationId),
      stage: result.fields.stage!,
      scheduledAt: result.fields.scheduledAt ?? null,
      notes: result.fields.notes ?? null
    }
  });
  response.status(201).json({ interview: serializeInterview(interview) });
}

export async function updateInterview(request: Request, response: Response): Promise<void> {
  const result = validateInterviewBody(request.body, true);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const interview = await prisma.interview.update({
    where: { id: String(request.params.interviewId) },
    data: result.fields
  });
  response.json({ interview: serializeInterview(interview) });
}

export async function deleteInterview(request: Request, response: Response): Promise<void> {
  await prisma.interview.delete({ where: { id: String(request.params.interviewId) } });
  response.status(204).send();
}
