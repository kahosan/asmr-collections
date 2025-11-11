import { mutate } from 'swr';
import { fetcher, HTTPError } from './fetcher';

import { logger } from './logger';
import { notifyError } from './utils';

export function mutateWorkInfo(id: string) {
  mutate(`work-info-${id}`, async () => {
    try {
      return await fetcher(`/api/work/${id}`);
    } catch (e) {
      if (e instanceof HTTPError && e.status === 404) {
        try {
          logger.warn(`${id} 不存在于数据库中，尝试使用 DLsite 预加载作品信息`);
          const data = await fetcher<Record<string, string>>(`/api/work/info/${id}`);
          return { ...data, exists: false };
        } catch (e) {
          notifyError(e, '获取作品信息失败');
          logger.error(e, '预加载作品信息失败');
          return null;
        }
      }
      notifyError(e, '获取作品信息失败');
      logger.error(e, '预加载作品信息失败');
      return null;
    }
  }, { revalidate: false });
}

export function mutateWorks() {
  mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
}
