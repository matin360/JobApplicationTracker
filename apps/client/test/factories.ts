import type { ApplicationDetail } from '../src/api/applications';
import type { InterviewRecord, NoteRecord, ReminderRecord } from '../src/api/children';
import type { DashboardSummary } from '../src/dashboard';

// Shared test fixtures. Every factory returns a fully-populated record;
// override only what the test cares about.

export function makeRecord(overrides: Partial<ApplicationDetail> = {}): ApplicationDetail {
  return {
    id: 'app-1',
    company: { id: 'c1', name: 'Acme Corp' },
    roleTitle: 'Frontend Engineer',
    location: 'Remote',
    source: 'LinkedIn',
    status: 'applied',
    appliedAt: '2026-07-01T00:00:00.000Z',
    jobUrl: 'https://acme.example.com/jobs/1',
    priority: 'high',
    nextFollowUpAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    notes: [],
    reminders: [],
    interviews: [],
    ...overrides
  };
}

export function makeNote(overrides: Partial<NoteRecord> = {}): NoteRecord {
  return {
    id: 'n1',
    applicationId: 'app-1',
    content: 'Existing note',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...overrides
  };
}

export function makeReminder(overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    id: 'r1',
    applicationId: 'app-1',
    title: 'Follow up',
    dueAt: '2099-12-31T00:00:00.000Z',
    completedAt: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...overrides
  };
}

export function makeInterview(overrides: Partial<InterviewRecord> = {}): InterviewRecord {
  return {
    id: 'i1',
    applicationId: 'app-1',
    stage: 'Phone screen',
    scheduledAt: '2026-07-10T14:00:00.000Z',
    notes: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...overrides
  };
}

export function makeSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    statusCounts: { saved: 1, applied: 4, interviewing: 2, offer: 1, rejected: 3, withdrawn: 0 },
    reminders: {
      active: 3,
      upcoming: 1,
      upcomingList: [
        {
          id: 'rem-1',
          title: 'Send thank-you email',
          dueAt: '2026-07-12T00:00:00.000Z',
          application: { id: 'app-1', roleTitle: 'Frontend Engineer', companyName: 'Acme' }
        }
      ]
    },
    recentApplications: [
      {
        id: 'app-1',
        companyName: 'Acme',
        roleTitle: 'Frontend Engineer',
        status: 'applied',
        appliedAt: '2026-07-01T00:00:00.000Z',
        nextFollowUpAt: null
      }
    ],
    ...overrides
  };
}
