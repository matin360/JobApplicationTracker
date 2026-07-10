import { requestJson } from './http';

// Child records of an application: notes, reminders, and interviews.

export interface NoteRecord {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRecord {
  id: string;
  applicationId: string;
  title: string;
  dueAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewRecord {
  id: string;
  applicationId: string;
  stage: string;
  scheduledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Notes ----------

export async function createNote(applicationId: string, content: string): Promise<NoteRecord> {
  const data = await requestJson<{ note: NoteRecord }>(`/api/applications/${applicationId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
  return data.note;
}

export async function updateNote(noteId: string, content: string): Promise<NoteRecord> {
  const data = await requestJson<{ note: NoteRecord }>(`/api/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  });
  return data.note;
}

export async function deleteNote(noteId: string): Promise<void> {
  await requestJson<void>(`/api/notes/${noteId}`, { method: 'DELETE' });
}

// ---------- Reminders ----------

export interface ReminderInput {
  title?: string;
  dueAt?: string;
  completed?: boolean;
}

export async function createReminder(applicationId: string, input: ReminderInput): Promise<ReminderRecord> {
  const data = await requestJson<{ reminder: ReminderRecord }>(`/api/applications/${applicationId}/reminders`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return data.reminder;
}

export async function updateReminder(reminderId: string, input: ReminderInput): Promise<ReminderRecord> {
  const data = await requestJson<{ reminder: ReminderRecord }>(`/api/reminders/${reminderId}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
  return data.reminder;
}

export async function deleteReminder(reminderId: string): Promise<void> {
  await requestJson<void>(`/api/reminders/${reminderId}`, { method: 'DELETE' });
}

// ---------- Interviews ----------

export interface InterviewInput {
  stage?: string;
  scheduledAt?: string | null;
  notes?: string | null;
}

export async function createInterview(applicationId: string, input: InterviewInput): Promise<InterviewRecord> {
  const data = await requestJson<{ interview: InterviewRecord }>(`/api/applications/${applicationId}/interviews`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return data.interview;
}

export async function updateInterview(interviewId: string, input: InterviewInput): Promise<InterviewRecord> {
  const data = await requestJson<{ interview: InterviewRecord }>(`/api/interviews/${interviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
  return data.interview;
}

export async function deleteInterview(interviewId: string): Promise<void> {
  await requestJson<void>(`/api/interviews/${interviewId}`, { method: 'DELETE' });
}
