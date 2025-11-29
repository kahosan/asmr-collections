import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { formatError } from '~/router/utils';

export const randomApp = new Hono()
  .get('/random', async c => {
    try {
      const prisma = getPrisma();

      const work = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM "Work" ORDER BY RANDOM() LIMIT 1;`;

      if (work.length === 0)
        return c.json(formatError('未找到作品'), 404);

      return c.json(work[0]);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  });
