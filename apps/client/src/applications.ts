export const APPLICATION_STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'rejected'] as const;
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

export async function getApplication(id: string): Promise<ApplicationRecord> {
  const data = await requestJson<{ application: ApplicationRecord }>(`/api/applications/${id}`);
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
