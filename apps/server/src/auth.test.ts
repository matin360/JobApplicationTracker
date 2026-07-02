import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import { bootstrapAuth, hashPassword, signup, verifyPassword } from './auth';
import type { AuthUser } from './auth';

const prisma = new PrismaClient();

test('hashPassword and verifyPassword work for the same password', async () => {
  const password = 'SuperSecret123!';
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('signup rejects malformed email addresses', async () => {
  let statusCode = 200;
  let responseBody: unknown;

  const response = {
    setHeader: () => undefined,
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      responseBody = payload;
    }
  } as unknown as Response;

  await signup(
    {
      body: {
        email: 'not-an-email',
        password: 'Password123!',
        name: 'Signup Tester'
      }
    } as unknown as Request,
    response
  );

  assert.equal(statusCode, 400);
  assert.deepEqual(responseBody, { error: 'Please provide a valid email address.' });
});

test('bootstrapAuth attaches the signed-in user from a valid session cookie', async () => {
  const user = await prisma.user.create({
    data: {
      email: 'bootstrap@example.com',
      name: 'Bootstrap User',
      passwordHash: await hashPassword('Password123!')
    }
  });

  const token = 'bootstrap-test-token';
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60_000)
    }
  });

  const request = {
    headers: { cookie: `sessionToken=${token}` },
    user: undefined as AuthUser | undefined
  } as unknown as Request & { user?: AuthUser };

  const response = {
    setHeader: () => undefined
  } as unknown as Response;

  let nextCalled = false;

  await bootstrapAuth(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(request.user?.id, user.id);
  assert.equal(request.user?.email, user.email);
  assert.equal(request.user?.name, user.name);

  await prisma.session.deleteMany({ where: { token } });
  await prisma.user.delete({ where: { id: user.id } });
});
