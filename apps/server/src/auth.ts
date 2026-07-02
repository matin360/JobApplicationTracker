import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const COOKIE_NAME = 'sessionToken';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name: string | null | undefined): boolean {
  if (typeof name !== 'string') {
    return true;
  }

  const trimmedName = name.trim();
  return trimmedName.length === 0 || trimmedName.length <= 100;
}

function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 72;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const parts = hashedPassword.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, salt, storedHash] = parts;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expectedHash = Buffer.from(storedHash, 'hex');

  if (derivedKey.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedHash);
}

function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.cookie ?? '';

  for (const cookie of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = cookie.trim().split('=');
    if (rawName === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
}

function setSessionCookie(response: Response, token: string): void {
  const isSecure = config.nodeEnv === 'production';
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const cookieValue = `sessionToken=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  response.setHeader('Set-Cookie', cookieValue);
}

function clearSessionCookie(response: Response): void {
  const isSecure = config.nodeEnv === 'production';
  const cookieValue = `sessionToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  response.setHeader('Set-Cookie', cookieValue);
}

async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
}

async function findUserBySessionToken(token: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }

    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name
  };
}

export async function bootstrapAuth(request: AuthenticatedRequest, _response: Response, next: NextFunction): Promise<void> {
  const token = getCookieValue(request, COOKIE_NAME);

  if (!token) {
    request.user = undefined;
    next();
    return;
  }

  const user = await findUserBySessionToken(token);

  if (!user) {
    clearSessionCookie(_response);
    request.user = undefined;
    next();
    return;
  }

  request.user = user;
  next();
}

export function getAuthenticatedUser(request: AuthenticatedRequest): AuthUser | undefined {
  return request.user;
}

export async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  await bootstrapAuth(request, response, next);

  if (!request.user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

export async function signup(request: Request, response: Response): Promise<void> {
  const rawEmail = typeof request.body?.email === 'string' ? request.body.email : '';
  const rawPassword = typeof request.body?.password === 'string' ? request.body.password : '';
  const rawName = typeof request.body?.name === 'string' ? request.body.name : null;

  const email = normalizeEmail(rawEmail);
  const password = rawPassword;
  const name = rawName?.trim() || null;

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  if (!isValidEmail(email)) {
    response.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  if (!isValidPassword(password)) {
    response.status(400).json({ error: 'Password must be between 8 and 72 characters long.' });
    return;
  }

  if (!isValidName(name)) {
    response.status(400).json({ error: 'Name must be 100 characters or fewer.' });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    response.status(409).json({ error: 'An account with that email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash
    }
  });

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(response, token);

  response.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    session: {
      expiresAt
    }
  });
}

export async function login(request: Request, response: Response): Promise<void> {
  const email = normalizeEmail(String(request.body?.email ?? '').trim());
  const password = String(request.body?.password ?? '');

  if (!email || !password) {
    response.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    response.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    response.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(response, token);

  response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    session: {
      expiresAt
    }
  });
}

export async function logout(request: Request, response: Response): Promise<void> {
  const token = getCookieValue(request, COOKIE_NAME);

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  clearSessionCookie(response);
  response.status(200).json({ success: true });
}

export async function me(request: AuthenticatedRequest, response: Response): Promise<void> {
  const user = getAuthenticatedUser(request);

  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}
