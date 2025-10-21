import { Hono } from 'hono';
import prisma from '~/lib/db';
import { formatError } from '../utils';

const modelFields = new Set(['genre', 'work', 'artist', 'circle', 'series', 'illustrator']);

export const fieldApp = new Hono();

fieldApp.get('/:field', async c => {
  const { field } = c.req.param();

  try {
    if (modelFields.has(field)) {
      // @ts-expect-error 我也没有办法啊啊啊啊啊啊啊啊啊
      const data = await prisma[field].findMany();
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
