import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { AuthUser } from './auth';
import { serializeInterview, serializeNote, serializeReminder } from './children';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const prisma = new PrismaClient();

export const APPLICATION_STATUSES = ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'] as const;
export const APPLICATION_PRIORITIES = ['low', 'medium', 'high'] as const;

type ApplicationWithCompany = Prisma.ApplicationGetPayload<{ include: { company: true } }>;

// Public shape returned to the client for every application.
function serializeApplication(application: ApplicationWithCompany) {
  return {
    id: application.id,
    company: application.company ? { id: application.company.id, name: application.company.name } : null,
    roleTitle: application.roleTitle,
    location: application.location,
    source: application.source,
    status: application.status,
    appliedAt: application.appliedAt?.toISOString() ?? null,
    jobUrl: application.jobUrl,
    priority: application.priority,
    nextFollowUpAt: application.nextFollowUpAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString()
  };
}

interface ValidatedFields {
  companyName?: string | null;
  roleTitle?: string;
  location?: string | null;
  source?: string | null;
  status?: string;
  appliedAt?: Date | null;
  jobUrl?: string | null;
  priority?: string | null;
  nextFollowUpAt?: Date | null;
}

// Validate the request body. `partial` allows omitted fields (PATCH); on POST the
// required fields are checked separately. Returns an error message or the fields.
function validateApplicationBody(body: unknown, partial: boolean): { error: string } | { fields: ValidatedFields } {
  const input = (body ?? {}) as Record<string, unknown>;
  const fields: ValidatedFields = {};

  const readString = (name: string): string | null | undefined => {
    if (!(name in input)) {
      return undefined;
    }
    const value = input[name];
    if (value === null || value === '') {
      return null;
    }
    return typeof value === 'string' ? value.trim() : undefined;
  };

  if ('roleTitle' in input) {
    const roleTitle = readString('roleTitle');
    if (!roleTitle) {
      return { error: 'Role title is required.' };
    }
    if (roleTitle.length > 200) {
      return { error: 'Role title must be 200 characters or fewer.' };
    }
    fields.roleTitle = roleTitle;
  } else if (!partial) {
    return { error: 'Role title is required.' };
  }

  if ('company' in input) {
    const company = readString('company');
    if (company === undefined) {
      return { error: 'Company must be a string.' };
    }
    if (company && company.length > 200) {
      return { error: 'Company must be 200 characters or fewer.' };
    }
    fields.companyName = company;
  }

  for (const name of ['location', 'source'] as const) {
    if (name in input) {
      const value = readString(name);
      if (value === undefined) {
        return { error: `${name === 'location' ? 'Location' : 'Source'} must be a string.` };
      }
      fields[name] = value;
    }
  }

  if ('status' in input) {
    const status = readString('status');
    if (!status || !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
      return { error: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}.` };
    }
    fields.status = status;
  }

  if ('priority' in input) {
    const priority = readString('priority');
    if (priority === null) {
      fields.priority = null;
    } else if (!priority || !APPLICATION_PRIORITIES.includes(priority as (typeof APPLICATION_PRIORITIES)[number])) {
      return { error: `Priority must be one of: ${APPLICATION_PRIORITIES.join(', ')}.` };
    } else {
      fields.priority = priority;
    }
  }

  if ('jobUrl' in input) {
    const jobUrl = readString('jobUrl');
    if (jobUrl === undefined) {
      return { error: 'Job URL must be a string.' };
    }
    if (jobUrl !== null) {
      try {
        const parsed = new URL(jobUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('unsupported protocol');
        }
      } catch {
        return { error: 'Job URL must be a valid http(s) URL.' };
      }
    }
    fields.jobUrl = jobUrl;
  }

  for (const name of ['appliedAt', 'nextFollowUpAt'] as const) {
    if (name in input) {
      const value = readString(name);
      if (value === null) {
        fields[name] = null;
      } else if (value === undefined) {
        return { error: `${name === 'appliedAt' ? 'Applied date' : 'Next follow-up date'} must be a string.` };
      } else {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return { error: `${name === 'appliedAt' ? 'Applied date' : 'Next follow-up date'} must be a valid date.` };
        }
        fields[name] = date;
      }
    }
  }

  return { fields };
}

// Find or create a company by name for this user; null clears the association.
async function resolveCompanyId(userId: string, companyName: string | null): Promise<string | null> {
  if (companyName === null) {
    return null;
  }

  const existing = await prisma.company.findFirst({ where: { userId, name: companyName } });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.company.create({ data: { userId, name: companyName } });
  return created.id;
}

export async function listApplications(request: AuthenticatedRequest, response: Response): Promise<void> {
  const applications = await prisma.application.findMany({
    where: { userId: request.user!.id },
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });

  response.json({ applications: applications.map(serializeApplication) });
}

export async function createApplication(request: AuthenticatedRequest, response: Response): Promise<void> {
  const result = validateApplicationBody(request.body, false);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const { companyName, ...fields } = result.fields;
  const companyId = companyName !== undefined ? await resolveCompanyId(request.user!.id, companyName) : null;

  const application = await prisma.application.create({
    data: {
      userId: request.user!.id,
      companyId,
      roleTitle: fields.roleTitle!,
      location: fields.location ?? null,
      source: fields.source ?? null,
      status: fields.status ?? 'saved',
      appliedAt: fields.appliedAt ?? null,
      jobUrl: fields.jobUrl ?? null,
      priority: fields.priority === undefined ? 'medium' : fields.priority,
      nextFollowUpAt: fields.nextFollowUpAt ?? null
    },
    include: { company: true }
  });

  response.status(201).json({ application: serializeApplication(application) });
}

// Detail view: the application plus all child records for the workspace page.
export async function getApplication(request: AuthenticatedRequest, response: Response): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: String(request.params.applicationId) },
    include: {
      company: true,
      notes: { orderBy: { createdAt: 'desc' } },
      reminders: { orderBy: { dueAt: 'asc' } },
      interviews: { orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }] }
    }
  });

  if (!application) {
    response.status(404).json({ error: 'Not found' });
    return;
  }

  response.json({
    application: {
      ...serializeApplication(application),
      notes: application.notes.map(serializeNote),
      reminders: application.reminders.map(serializeReminder),
      interviews: application.interviews.map(serializeInterview)
    }
  });
}

export async function updateApplication(request: AuthenticatedRequest, response: Response): Promise<void> {
  const result = validateApplicationBody(request.body, true);
  if ('error' in result) {
    response.status(400).json({ error: result.error });
    return;
  }

  const { companyName, ...fields } = result.fields;
  const data: Prisma.ApplicationUncheckedUpdateInput = { ...fields };

  if (companyName !== undefined) {
    data.companyId = await resolveCompanyId(request.user!.id, companyName);
  }

  const application = await prisma.application.update({
    where: { id: String(request.params.applicationId) },
    data,
    include: { company: true }
  });

  response.json({ application: serializeApplication(application) });
}

export async function deleteApplication(request: AuthenticatedRequest, response: Response): Promise<void> {
  // Notes, reminders, and interviews cascade via the schema's onDelete: Cascade.
  await prisma.application.delete({ where: { id: String(request.params.applicationId) } });
  response.status(204).send();
}
