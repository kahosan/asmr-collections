import { preload } from 'swr';

import { logger } from '~/lib/logger';
import { fetcher, HTTPError } from '~/lib/fetcher';

export function preloadWorkDetails(id: string, abort: AbortController) {
  preload(`work-info-${id}`, async () => {
    try {
      return await fetcher(`/api/work/${id}`, { signal: abort.signal });
    } catch (e) {
      if (e instanceof HTTPError && e.status === 404) {
        try {
          logger.warn(`${id} 不存在于数据库中，尝试使用 DLsite 预加载作品信息`);
          const data = await fetcher<Record<string, string>>(
            `/api/work/info/${id}`,
            { signal: abort.signal }
          );
          return { ...data, exists: false };
        } catch (e) {
          logger.error(e, '预加载作品信息失败');
          return null;
        }
      }
      logger.error(e, '预加载作品信息失败');
      return null;
    }
  });
}
