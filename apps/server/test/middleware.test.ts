import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { asyncHandler, errorHandler } from '../src/middleware';

function makeResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headersSent: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    }
  };
}

test('asyncHandler forwards rejections to next()', async () => {
  const boom = new Error('boom');
  const wrapped = asyncHandler(async () => {
    throw boom;
  });

  let forwarded: unknown;
  wrapped({} as Request, {} as Response, ((error: unknown) => {
    forwarded = error;
  }) as NextFunction);

  // Let the rejected promise settle.
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(forwarded, boom);
});

test('errorHandler answers 500 JSON for unexpected errors', () => {
  const response = makeResponse();

  errorHandler(new Error('unexpected'), {} as Request, response as unknown as Response, (() => undefined) as NextFunction);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { error: 'Internal server error' });
});

test('errorHandler maps Prisma P2025 (record not found) to 404', () => {
  const response = makeResponse();
  const notFound = new Prisma.PrismaClientKnownRequestError('No record found', {
    code: 'P2025',
    clientVersion: 'test'
  });

  errorHandler(notFound, {} as Request, response as unknown as Response, (() => undefined) as NextFunction);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, { error: 'Not found' });
});
