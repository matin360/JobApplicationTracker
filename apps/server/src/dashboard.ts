import type { Response } from 'express';
import { APPLICATION_STATUSES } from './applications';
import { prisma } from './prisma';
import type { AuthenticatedRequest } from './types';
import { requireUser } from './types';

// How far ahead "upcoming" reminders look.
export const UPCOMING_REMINDER_DAYS = 7;
const RECENT_APPLICATION_LIMIT = 10;
const UPCOMING_REMINDER_LIMIT = 5;

/**
 * GET /api/dashboard/summary — response schema
 *
 * {
 *   statusCounts:   { saved, applied, interviewing, offer, rejected, withdrawn }  // every status, zero-filled
 *   reminders: {
 *     active:       number   // not completed, any due date
 *     upcoming:     number   // not completed, due within UPCOMING_REMINDER_DAYS days
 *     upcomingList: [{ id, title, dueAt, application: { id, roleTitle, companyName } }]  // soonest first, capped
 *   }
 *   recentApplications: [{ id, companyName, roleTitle, status, appliedAt, nextFollowUpAt }]  // newest first, capped
 * }
 *
 * All data is scoped to the authenticated user. No conversion rates or trends yet.
 */
export async function getDashboardSummary(request: AuthenticatedRequest, response: Response): Promise<void> {
  const userId = requireUser(request).id;
  const now = new Date();
  const upcomingCutoff = new Date(now.getTime() + UPCOMING_REMINDER_DAYS * 24 * 60 * 60 * 1000);

  const [statusGroups, activeReminders, upcomingCount, upcomingReminders, recentApplications] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true }
    }),
    prisma.reminder.count({
      where: { completedAt: null, application: { userId } }
    }),
    prisma.reminder.count({
      where: { completedAt: null, dueAt: { lte: upcomingCutoff }, application: { userId } }
    }),
    prisma.reminder.findMany({
      where: { completedAt: null, dueAt: { lte: upcomingCutoff }, application: { userId } },
      include: { application: { include: { company: true } } },
      orderBy: { dueAt: 'asc' },
      take: UPCOMING_REMINDER_LIMIT
    }),
    prisma.application.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
      take: RECENT_APPLICATION_LIMIT
    })
  ]);

  const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0])) as Record<string, number>;
  for (const group of statusGroups) {
    if (group.status in statusCounts) {
      statusCounts[group.status] = group._count._all;
    }
  }

  response.json({
    statusCounts,
    reminders: {
      active: activeReminders,
      upcoming: upcomingCount,
      upcomingList: upcomingReminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        dueAt: reminder.dueAt.toISOString(),
        application: {
          id: reminder.application.id,
          roleTitle: reminder.application.roleTitle,
          companyName: reminder.application.company?.name ?? null
        }
      }))
    },
    recentApplications: recentApplications.map((application) => ({
      id: application.id,
      companyName: application.company?.name ?? null,
      roleTitle: application.roleTitle,
      status: application.status,
      appliedAt: application.appliedAt?.toISOString() ?? null,
      nextFollowUpAt: application.nextFollowUpAt?.toISOString() ?? null
    }))
  });
}
