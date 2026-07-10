import { requestJson } from './api/http';
import type { ApplicationStatus } from './api/applications';

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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return requestJson<DashboardSummary>('/api/dashboard/summary');
}
