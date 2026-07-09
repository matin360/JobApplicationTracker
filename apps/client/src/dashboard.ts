import type { ApplicationStatus } from './applications';

export interface UpcomingReminder {
  id: string;
  title: string;
  dueAt: string;
  application: {
    id: string;
    roleTitle: string;
    companyName: string | null;
  };
}

export interface RecentApplication {
  id: string;
  companyName: string | null;
  roleTitle: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  nextFollowUpAt: string | null;
}

// Mirrors the schema documented on the server's GET /api/dashboard/summary.
export interface DashboardSummary {
  statusCounts: Record<ApplicationStatus, number>;
  reminders: {
    active: number;
    upcoming: number;
    upcomingList: UpcomingReminder[];
  };
  recentApplications: RecentApplication[];
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${apiBaseUrl}/api/dashboard/summary`, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Failed to load the dashboard. (${response.status} ${response.statusText})`);
  }

  return (await response.json()) as DashboardSummary;
}
