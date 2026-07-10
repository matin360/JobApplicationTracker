import { Prisma } from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

type MaybeAsyncHandler = (request: Request, response: Response, next: NextFunction) => unknown;

// Express 4 does not catch errors thrown in async handlers; without this wrapper a
// rejected handler becomes an unhandled promise rejection instead of a 500 response.
export function asyncHandler(handler: MaybeAsyncHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

// Terminal error middleware: keep the process alive and answer with JSON.
export function errorHandler(error: unknown, _request: Request, response: Response, next: NextFunction): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  // "Record not found" — e.g. a PATCH/DELETE racing another delete after the
  // ownership check passed. To the client that's the same as a missing resource.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    response.status(404).json({ error: 'Not found' });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
}
