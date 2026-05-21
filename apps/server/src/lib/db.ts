/* eslint-disable antfu/no-top-level-await -- */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaNeon } from '@prisma/adapter-neon';

import { IS_WORKERS } from './constant';
import { PrismaClient as PrismaClientWorkers } from './prisma-workers/client';

const adapterNeon = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

const prismaPg = IS_WORKERS
  ? null
  : await (async () => {
    const adapterPg = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    return import('./prisma/client')
      .then(m => new m.PrismaClient({ adapter: adapterPg }));
  })();

export const prisma = new Proxy({} as PrismaClientWorkers, {
  get(_, prop, receiver) {
    if (IS_WORKERS) {
      const prismaWorkers = new PrismaClientWorkers({ adapter: adapterNeon });
      return Reflect.get(prismaWorkers, prop, receiver);
    }

    if (!prismaPg)
      throw new Error('Prisma client is not initialized');

    return Reflect.get(prismaPg, prop, receiver);
  }
});
