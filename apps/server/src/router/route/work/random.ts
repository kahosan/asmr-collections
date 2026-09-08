import { Hono } from 'hono';
import { DiscoveryModeSchema } from '@asmr-collections/shared';

import * as z from 'zod';

import { prisma } from '~/lib/db';
import { discover } from '~/discovery';
import { zValidator } from '~/lib/validator';
import { formatError, formatMessage } from '~/router/utils';

const querySchema = z.object({
  mode: DiscoveryModeSchema.default('pure')
});

export const randomApp = new Hono()
  .get('/random', zValidator('query', querySchema), async c => {
    try {
      const { mode } = c.req.valid('query');
      if (mode === 'pure') {
        const works = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "Work" ORDER BY RANDOM() LIMIT 1;
        `;
        const work = works.at(0);
        if (!work)
          return c.json(formatMessage('未找到作品'), 404);

        return c.json(work);
      }

      const data = await discover.generate({
        scene: 'random',
        source: 'personal',
        mode,
        count: 1
      });

      const work = data.data.at(0)?.work;
      if (!work)
        return c.json(formatMessage('未找到作品'), 404);

      return c.json({ id: work.id });
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  });
