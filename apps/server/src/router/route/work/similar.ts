import type { ServerWork } from '@asmr-collections/shared';

import { Hono } from 'hono';
import { HTTPError } from '@asmr-collections/shared';

import * as z from 'zod';

import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { createCachified, ttl } from '~/lib/cachified';
import { fetchSimilarWorks } from '~/provider/asmrone';
import { formatError, formatMessage } from '~/router/utils';

const [similarCache, clear] = createCachified<ServerWork[]>();

export const similarApp = new Hono();

const schema = z.object({
  api: z.url().optional()
});

similarApp.get('/similar/:id', zValidator('query', schema), async c => {
  const { id } = c.req.param();
  const { api } = c.req.valid('query');

  try {
    if (api) {
      const works = await similarCache({
        cacheKey: `asmrone-similar-work-${id}-${encodeURIComponent(api)}`,
        getFreshValue: () => fetchSimilarWorks(id, api),
        ttl: ttl.day(7),
        ctx: c
      });
      if (works.length === 0)
        return c.json(formatMessage('作品不存在于 ASMR.ONE 或没有向量信息'), 404);

      return c.json(works);
    }

    const similarWorks = await similarCache({
      cacheKey: `similar-work-${id}`,
      getFreshValue: () => getSimilar(id),
      ttl: ttl.hour(1),
      ctx: c
    });

    // 检查是否找到结果
    if (similarWorks.length === 0)
      return c.json(formatMessage('作品不存在或没有向量信息'), 404);

    return c.json(similarWorks);
  } catch (e) {
    if (e instanceof HTTPError)
      return c.json(formatError(e), e.status);

    return c.json(formatError(e), 500);
  }
});

export function clearSimilarCache(id: string) {
  return clear(`similar-work-${id}`, false);
}

async function getSimilar(id: string) {
  const prisma = getPrisma();

  const similarIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT w.id
    FROM "Work" w
    JOIN "Work" target ON target.id = ${id}
    WHERE w.embedding IS NOT NULL
      AND w.id != ${id}
    ORDER BY w.embedding <=> target.embedding
    LIMIT 10
  `;

  if (similarIds.length === 0) return [];

  const targetIds = similarIds.map(item => item.id);

  const works = await prisma.work.findMany({
    where: {
      id: { in: targetIds }
    },
    include: {
      circle: true,
      series: true,
      artists: true,
      illustrators: true,
      genres: true,
      translationInfo: true
    }
  });

  return works.sort((a, b) => targetIds.indexOf(a.id) - targetIds.indexOf(b.id)) as unknown as ServerWork[];
}
