import { PrismaClient } from '@prisma/client';

// One client (and connection pool) for the whole process. Import this instead
// of constructing PrismaClient per module.
export const prisma = new PrismaClient();
