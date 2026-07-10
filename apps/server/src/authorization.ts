import type { NextFunction, Response } from 'express';
import { prisma } from './prisma';
import type { AuthenticatedRequest } from './types';

function getRouteParam(request: AuthenticatedRequest, name: string): string | null {
  const value = request.params[name];
  return typeof value === 'string' && value.trim() ? value : null;
}

export function requireResourceOwnership(
  checkOwnership: (request: AuthenticatedRequest, userId: string) => Promise<boolean>
) {
  return async function authorizationMiddleware(
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    if (!request.user?.id) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const isOwner = await checkOwnership(request, request.user.id);
    if (!isOwner) {
      response.status(404).json({ error: 'Not found' });
      return;
    }

    next();
  };
}

export const requireApplicationOwnership = () =>
  requireResourceOwnership(async (request, userId) => {
    const applicationId = getRouteParam(request, 'applicationId');
    if (!applicationId) {
      return false;
    }

    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });

    return Boolean(application);
  });

export const requireNoteOwnership = () =>
  requireResourceOwnership(async (request, userId) => {
    const noteId = getRouteParam(request, 'noteId');
    if (!noteId) {
      return false;
    }

    const note = await prisma.note.findFirst({
      where: { id: noteId },
      include: { application: true }
    });

    return note?.application.userId === userId;
  });

export const requireReminderOwnership = () =>
  requireResourceOwnership(async (request, userId) => {
    const reminderId = getRouteParam(request, 'reminderId');
    if (!reminderId) {
      return false;
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId },
      include: { application: true }
    });

    return reminder?.application.userId === userId;
  });

export const requireInterviewOwnership = () =>
  requireResourceOwnership(async (request, userId) => {
    const interviewId = getRouteParam(request, 'interviewId');
    if (!interviewId) {
      return false;
    }

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId },
      include: { application: true }
    });

    return interview?.application.userId === userId;
  });

