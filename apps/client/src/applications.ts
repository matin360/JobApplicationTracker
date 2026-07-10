export const APPLICATION_STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'] as const;
export const APPLICATION_PRIORITIES = ['low', 'medium', 'high'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];

export interface ApplicationRecord {
  id: string;
  company: { id: string; name: string } | null;
  roleTitle: string;
  location: string | null;
  source: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  jobUrl: string | null;
  priority: ApplicationPriority | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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

// Detail response: the application plus its child records.
export interface ApplicationDetail extends ApplicationRecord {
  notes: NoteRecord[];
  reminders: ReminderRecord[];
  interviews: InterviewRecord[];
}

// Payload for create/edit; `company` is a plain name the server resolves to a record.
export interface ApplicationInput {
  company?: string | null;
  roleTitle?: string;
  location?: string | null;
  source?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string | null;
  jobUrl?: string | null;
  priority?: ApplicationPriority | null;
  nextFollowUpAt?: string | null;
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

function buildApiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body; fall through to the status check below.
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed. (${response.status} ${response.statusText})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const data = await requestJson<{ applications: ApplicationRecord[] }>('/api/applications');
  return data.applications;
}

export async function getApplication(id: string): Promise<ApplicationDetail> {
  const data = await requestJson<{ application: ApplicationDetail }>(`/api/applications/${id}`);
  return data.application;
}

export async function createApplication(input: ApplicationInput): Promise<ApplicationRecord> {
  const data = await requestJson<{ application: ApplicationRecord }>('/api/applications', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return data.application;
}

export async function updateApplication(id: string, input: ApplicationInput): Promise<ApplicationRecord> {
  const data = await requestJson<{ application: ApplicationRecord }>(`/api/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
  return data.application;
}

export async function deleteApplication(id: string): Promise<void> {
  await requestJson<void>(`/api/applications/${id}`, { method: 'DELETE' });
}

export interface ExportFilters {
  statuses?: ApplicationStatus[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

// Download the user's applications as CSV, honoring the given filters.
// Fetches with credentials, then triggers a browser download via an object URL.
export async function downloadApplicationsCsv(filters: ExportFilters = {}): Promise<void> {
  const params = new URLSearchParams();
  if (filters.statuses && filters.statuses.length > 0) {
    params.set('status', filters.statuses.join(','));
  }
  if (filters.from) {
    params.set('from', filters.from);
  }
  if (filters.to) {
    params.set('to', filters.to);
  }

  const query = params.toString();
  const response = await fetch(buildApiUrl(`/api/applications/export${query ? `?${query}` : ''}`), {
    credentials: 'include'
  });

  if (!response.ok) {
    let message = `Export failed. (${response.status} ${response.statusText})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Non-JSON error body; keep the status message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'applications.csv';

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
