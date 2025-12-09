import { match } from 'ts-pattern';
import { logger } from './logger';
import { HTTPError } from '@asmr-collections/shared';

import type { FetcherKey } from '~/types/fetcher';

export async function fetcher<T>(key: FetcherKey, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(new URL(key, window.document.baseURI), {
      ...options,
      referrerPolicy: 'no-referrer-when-downgrade'
    });

    const data = await match(res.headers.get('Content-Type'))
      .when(type => type?.includes('application/json'), () => res.json())
      .when(type => type?.includes('application/octet-stream'), () => res.arrayBuffer())
      .otherwise(() => res.text());

    if (!res.ok) {
      if (typeof data === 'object' && data.message) {
        if (typeof data.message === 'object') throw new HTTPError(data.message.name, res.status, data?.data);
        throw new HTTPError(data.message, res.status, data?.data);
      } else if (typeof data === 'object' && data.error) {
        throw new HTTPError(data.error, res.status, data?.data);
      } else if (data) {
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        const error = stringData.includes('<!DOCTYPE html>') ? `服务器发生错误：${res.status}` : stringData;
        throw new HTTPError(`未知错误: ${error}`, res.status);
      }
      throw new HTTPError(res.statusText || '请求失败', res.status);
    }

    return data as T;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
