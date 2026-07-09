import type { ApplicationDetail } from '../../applications';

export interface ActivityEvent {
  when: string;
  text: string;
}

const MAX_EVENTS = 8;

// Derive a recent-activity feed from the application and its children.
export function buildActivity(application: ApplicationDetail): ActivityEvent[] {
  const events: ActivityEvent[] = [{ when: application.createdAt, text: 'Application created' }];

  if (application.appliedAt) {
    events.push({ when: application.appliedAt, text: 'Applied' });
  }

  for (const note of application.notes) {
    events.push({ when: note.createdAt, text: 'Note added' });
  }

  for (const reminder of application.reminders) {
    events.push({ when: reminder.createdAt, text: `Reminder added: ${reminder.title}` });
    if (reminder.completedAt) {
      events.push({ when: reminder.completedAt, text: `Reminder completed: ${reminder.title}` });
    }
  }

  for (const interview of application.interviews) {
    events.push({ when: interview.createdAt, text: `Interview added: ${interview.stage}` });
  }

  return events.sort((a, b) => b.when.localeCompare(a.when)).slice(0, MAX_EVENTS);
}
