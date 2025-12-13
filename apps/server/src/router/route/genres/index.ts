import { Hono } from 'hono';

import * as z from 'zod';

import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { formatError } from '~/router/utils';
import { fetchTags } from '~/provider/asmrone';

const syncSchema = z.object({
  api: z.string()
});

export const genresApp = new Hono()
  .post('/sync', zValidator('json', syncSchema), async c => {
    const { api } = c.req.valid('json');

    try {
      const _tags = await fetchTags(api);
      const tags = new Map(_tags.map(t => [t.id, t.name]));

      const prisma = getPrisma();
      const genres = await prisma.genre.findMany({
        where: {
          id: { in: _tags.map(t => t.id) }
        },
        select: { id: true }
      });

      const operations = genres.map(genre => {
        const name = tags.get(genre.id);
        return prisma.genre.update({
          where: { id: genre.id },
          data: { name }
        });
      });

      if (operations.length > 0)
        await prisma.$transaction(operations);

      return c.body(null, 200);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  });
