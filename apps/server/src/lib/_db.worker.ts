import { PrismaNeon } from '@prisma/adapter-neon';

import { PrismaClient } from './prisma-workers/client';

const adapterNeon = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const _prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const prismaWorkers = new PrismaClient({ adapter: adapterNeon });
    const value = Reflect.get(prismaWorkers, prop);

    return typeof value === 'function' ? value.bind(prismaWorkers) : value;
  }
});
