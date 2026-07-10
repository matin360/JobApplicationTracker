import type { Request, Response } from 'express';
import type { AuthUser } from '../src/auth';
import { prisma } from '../src/prisma';

// Superset fake response used by every handler test: JSON handlers read
// statusCode/body, the CSV export reads headers/sent, 204 handlers read ended.
export interface FakeResponse extends Response {
  statusCode: number;
  body: unknown;
  ended: boolean;
  headers: Record<string, string>;
  sent: string | null;
}

export function makeResponse(): FakeResponse {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    ended: false,
    headers: {} as Record<string, string>,
    sent: null as string | null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    send(payload?: string) {
      this.sent = payload ?? null;
      this.ended = true;
    }
  };
  return response as unknown as FakeResponse;
}

export function makeRequest(
  user: AuthUser,
  options: { body?: unknown; params?: Record<string, string>; query?: Record<string, string> } = {}
): Request {
  return {
    user,
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {}
  } as unknown as Request;
}

// Unique per call so tests never collide with each other or previous runs.
export async function createTestUser(label: string): Promise<AuthUser> {
  const user = await prisma.user.create({
    data: {
      email: `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: `Test ${label}`
    }
  });
  return { id: user.id, email: user.email, name: user.name };
}

// Minimal CSV parser good enough to verify RFC 4180 output, including quoted
// fields with embedded commas, quotes, and newlines.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r' && text[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
