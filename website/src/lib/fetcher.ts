import { match } from 'ts-pattern';
import type { FetcherKey } from '~/types/fetcher';

export class HTTPError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.data = data;
  }
}

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
      } else {
        throw new HTTPError(`未知错误: ${JSON.stringify(data)}`, res.status);
      }
    }

    return data as T;
  } catch (e) {
    if (e instanceof HTTPError) throw e;

    throw new Error('未知错误');
  }
}
