import type { ServerWork } from '@asmr-collections/shared';

import { Hono } from 'hono';
import { HTTPError } from '@asmr-collections/shared';

import * as z from 'zod';

import { zValidator } from '~/lib/validator';
import { workRepo } from '~/repository/work';
import { ASMROneProvider } from '~/provider/asmrone';
import { createCachified, ttl } from '~/lib/cachified';
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
      const asmrone = new ASMROneProvider(api);
      const works = await similarCache({
        cacheKey: `asmrone-similar-work-${id}-${encodeURIComponent(api)}`,
        getFreshValue: () => asmrone.similar(id),
        ttl: ttl.day(7),
        ctx: c
      });
      if (works.length === 0)
        return c.json(formatMessage('作品不存在于 ASMR.ONE 或没有向量信息'), 404);

      return c.json(works);
    }

    const similarWorks = await similarCache({
      cacheKey: `similar-work-${id}`,
      getFreshValue: () => workRepo.similar(id, 10),
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

    console.error(e);
    return c.json(formatError(e), 500);
  }
});

export function clearSimilarCache(id: string) {
  return clear(`similar-work-${id}`, false);
}
