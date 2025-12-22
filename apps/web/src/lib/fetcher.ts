import { match, P } from 'ts-pattern';
import { logger } from './logger';
import { HTTPError } from '@asmr-collections/shared';

import type { FetcherKey } from '~/types/fetcher';

export async function fetcher<T>(key: FetcherKey, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(new URL(key, window.document.baseURI), {
      ...options,
      referrerPolicy: 'no-referrer-when-downgrade'
    });

    const contentType = res.headers.get('Content-Type');

    const data = await match(contentType)
      .when(type => type?.includes('application/json'), () => res.json())
      .when(type => type?.includes('application/octet-stream'), () => res.arrayBuffer())
      .otherwise(() => res.text());

    if (!res.ok) {
      match(data)
        .with({ message: P.string }, ({ message }) => {
          throw new HTTPError(message, res.status, data?.data);
        })
        .with({ message: { name: P.string } }, ({ message }) => {
          throw new HTTPError(message.name, res.status, data?.data);
        })
        .with({ error: P.string }, ({ error }) => {
          throw new HTTPError(error, res.status, data?.data);
        })
        .otherwise(unmatched => {
          throw new HTTPError(res.statusText || '请求失败', res.status, unmatched);
        });
    }

    return data as T;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
