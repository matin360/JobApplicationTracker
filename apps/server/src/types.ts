import type { Request } from 'express';
import type { AuthUser } from './auth';

// Request shape after bootstrapAuth/requireAuth have run.
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// For handlers behind requireAuth: returns the user or throws (surfaced as a 500
// by the error middleware), instead of scattering `request.user!` assertions.
export function requireUser(request: AuthenticatedRequest): AuthUser {
  if (!request.user) {
    throw new Error('requireAuth must run before this handler.');
  }
  return request.user;
}
