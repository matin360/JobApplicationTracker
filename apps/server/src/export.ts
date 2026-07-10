import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { AuthUser } from './auth';
import { APPLICATION_STATUSES } from './applications';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const prisma = new PrismaClient();

/**
 * GET /api/applications/export — CSV export of the current user's applications.
 *
 * Columns (in order):
 *   id               application id
 *   company_name     company name, empty if none
 *   role_title       role title
 *   location         empty if unset
 *   source           empty if unset
 *   status           saved | applied | interviewing | offer | rejected | withdrawn
 *   applied_at       YYYY-MM-DD, empty if unset
 *   job_url          empty if unset
 *   priority         low | medium | high, empty if unset
 *   next_follow_up_at YYYY-MM-DD, empty if unset
 *   notes_count      number of notes on the application
 *   created_at       full ISO 8601 timestamp
 *
 * Optional query filters (combine with AND):
 *   status  comma-separated list, e.g. ?status=applied,interviewing → 400 on unknown status
 *   from    YYYY-MM-DD — include applications applied on/after this date
 *   to      YYYY-MM-DD — include applications applied on/before this date
 *   Applications without an applied date are excluded when from/to is present
 *   (matching the list page's date-range filter).
 *
 * Rows are ordered newest-created first. Output is RFC 4180: fields containing
 * commas, quotes, or newlines are double-quoted with quotes doubled.
 */

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toDateOnly(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : '';
}

function readQueryString(request: Request, name: string): string | undefined {
  const value = request.query[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const CSV_HEADER = [
  'id',
  'company_name',
  'role_title',
  'location',
  'source',
  'status',
  'applied_at',
  'job_url',
  'priority',
  'next_follow_up_at',
  'notes_count',
  'created_at'
];

export async function exportApplicationsCsv(request: AuthenticatedRequest, response: Response): Promise<void> {
  const where: Prisma.ApplicationWhereInput = { userId: request.user!.id };

  const statusParam = readQueryString(request, 'status');
  if (statusParam) {
    const statuses = statusParam.split(',').map((status) => status.trim()).filter(Boolean);
    const invalid = statuses.filter(
      (status) => !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])
    );
    if (statuses.length === 0 || invalid.length > 0) {
      response.status(400).json({ error: `Unknown status filter: ${invalid.join(', ') || '(empty)'}.` });
      return;
    }
    where.status = { in: statuses };
  }

  const fromParam = readQueryString(request, 'from');
  const toParam = readQueryString(request, 'to');
  if (fromParam || toParam) {
    const appliedAt: Prisma.DateTimeNullableFilter = {};
    if (fromParam) {
      const from = new Date(`${fromParam}T00:00:00.000Z`);
      if (Number.isNaN(from.getTime())) {
        response.status(400).json({ error: 'Invalid "from" date; use YYYY-MM-DD.' });
        return;
      }
      appliedAt.gte = from;
    }
    if (toParam) {
      const to = new Date(`${toParam}T23:59:59.999Z`);
      if (Number.isNaN(to.getTime())) {
        response.status(400).json({ error: 'Invalid "to" date; use YYYY-MM-DD.' });
        return;
      }
      appliedAt.lte = to;
    }
    // Excludes rows with no applied date, same as the list page's filter.
    where.appliedAt = appliedAt;
  }

  const applications = await prisma.application.findMany({
    where,
    include: { company: true, _count: { select: { notes: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const lines = [CSV_HEADER.join(',')];
  for (const application of applications) {
    lines.push(
      [
        application.id,
        application.company?.name ?? '',
        application.roleTitle,
        application.location ?? '',
        application.source ?? '',
        application.status,
        toDateOnly(application.appliedAt),
        application.jobUrl ?? '',
        application.priority ?? '',
        toDateOnly(application.nextFollowUpAt),
        String(application._count.notes),
        application.createdAt.toISOString()
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="applications-${today}.csv"`);
  response.send(`${lines.join('\r\n')}\r\n`);
}
