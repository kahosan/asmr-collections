import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getPrisma() {
  if (process.env.RUNTIME === 'workers') {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter });
  }

  return prisma;
}
