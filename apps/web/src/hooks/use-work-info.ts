import useSWRImmutable from 'swr/immutable';

import { notifyError } from '~/utils';
import { logger } from '~/lib/logger';
import { fetcher } from '~/lib/fetcher';

import { HTTPError } from '@asmr-collections/shared';

import type { Work } from '@asmr-collections/shared';
import type { BareFetcher, SWRConfiguration } from 'swr';

export async function workInfoFetcher(id: string, cause: 'preload' | 'enter' | 'stay'): Promise<Work | null> {
  try {
    const data = await fetcher<Work>(`/api/work/${id}`);
    return { ...data, exists: true };
  } catch (e) {
    if (e instanceof HTTPError && e.status === 404) {
      try {
        logger.warn(`${id} 不存在于数据库中，尝试使用 DLsite 预加载作品信息`);
        const data = await fetcher<Work>(`/api/work/info/${id}`);
        return { ...data, exists: false };
      } catch (e) {
        if (cause === 'enter') notifyError(e, '获取作品信息失败');
        logger.error(e, '预加载作品信息失败');
        return null;
      }
    }
    if (cause === 'enter') notifyError(e, '获取作品信息失败');
    logger.error(e, '预加载作品信息失败');
    return null;
  }
}

export function useWorkInfo(id: string, config?: SWRConfiguration<Work | null, Error, BareFetcher<Work | null>>) {
  return useSWRImmutable<Work | null>(
    `work-info-${id}`,
    () => workInfoFetcher(id, 'enter'),
    config
  );
}
