import { PrismaNeon } from '@prisma/adapter-neon';

import { PrismaClient } from './prisma-workers/client';

const adapterNeon = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const _prisma = new Proxy({} as PrismaClient, {
  get(_, prop, receiver) {
    const prismaWorkers = new PrismaClient({ adapter: adapterNeon });
    return Reflect.get(prismaWorkers, prop, receiver);
  }
});
