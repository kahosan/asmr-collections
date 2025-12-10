import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { formatError } from '~/router/utils';

const modelFields = new Set(['genre', 'work', 'artist', 'circle', 'series', 'illustrator']);

export const fieldApp = new Hono();

fieldApp.get('/:field', async c => {
  const { field } = c.req.param();
  const prisma = getPrisma();

  try {
    if (modelFields.has(field)) {
      // @ts-expect-error 我也没有办法啊啊啊啊啊啊啊啊啊
      const data = await prisma[field].findMany({
        where: {
          works: { some: {} }
        },
        orderBy: { id: 'asc' }
      });
      return Array.isArray(data.at(0)) ? c.json(data.flat()) : c.json(data);
    }

    const work = await prisma.work.findMany({
      select: {
        [field]: true
      }
    });

    const data = work.map(w => w[field]);

    return Array.isArray(data.at(0)) ? c.json(data.flat()) : c.json(data);
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
