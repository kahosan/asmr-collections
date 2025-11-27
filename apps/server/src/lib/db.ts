/* eslint-disable antfu/no-top-level-await -- */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaNeon } from '@prisma/adapter-neon';

import { IS_WORKERS } from './constant';
import { PrismaClient as PrismaClientWorkers } from './prisma-workers/client';

const adapterNeon = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const adapterPg = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = IS_WORKERS
  ? null
  : await import('./prisma/client')
    .then(m => new m.PrismaClient({ adapter: adapterPg }));

export function getPrisma() {
  if (IS_WORKERS)
    return new PrismaClientWorkers({ adapter: adapterNeon });

  return prisma!;
}
