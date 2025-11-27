import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { formatError } from '~/router/utils';

export const randomApp = new Hono()
  .get('/random', async c => {
    try {
      const prisma = getPrisma();

      const count = await prisma.work.count();
      const work = await prisma.work.findFirst({
        select: { id: true },
        skip: Math.floor(Math.random() * Math.max(1, count))
      });

      if (!work)
        return c.json(formatError('未找到作品'), 404);

      return c.json(work);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  });
