import { requestJson } from './http';
import type { InterviewRecord, NoteRecord, ReminderRecord } from './children';

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
