import type { Creater, Data, ServerWork, WorkInfoResponse } from '@asmr-collections/shared';

import { Hono } from 'hono';
import { HTTPError } from '@asmr-collections/shared';

import { dlsite } from '~/provider/dlsite';
import { createCachified, ttl } from '~/lib/cachified';
import { formatError, formatMessage } from '~/router/utils';

const [dlsiteCache, clearDLsiteCache] = createCachified<WorkInfoResponse<ServerWork> | null>({
  ttl: ttl.day(1)
});

export const infoApp = new Hono();

infoApp.get('/info/:id', async c => {
  const { id } = c.req.param();

  try {
    const data = await dlsiteCache({
      cacheKey: `dlsite-work-info-${id}`,
      async getFreshValue() {
        const data = await dlsite.product(id);

        if (!data)
          return null;

        return {
          ...data,
          artists: creater(data.artists),
          illustrators: creater(data.illustrators),
          playback: null,
          subtitles: false
        };
      },
      ctx: c
    });

    if (!data) {
      await clearDLsiteCache(`dlsite-work-info-${id}`);
      return c.json(formatMessage('DLsite 不存在此作品'), 404);
    }

    return c.json(data);
  } catch (e) {
    console.error(e);
    if (e instanceof HTTPError)
      return c.json(formatError(e), e.status);

    return c.json(formatError(e), 500);
  }
});

function creater(c: Array<Data<string>>): Creater[] {
  return c.map(v => ({
    name: v.name,
    source: 'dlsite',
    sourceId: v.id
  }));
}
