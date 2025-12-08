import type { WebDAVClientContext } from '../types';

import { joinURL } from '@asmr-collections/shared';
import { encodePath } from '@asmr-collections/shared';

export class HTTPError<T> extends Error {
  status: number;
  data?: T;
  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.data = data;
  }
}

export function createRequestOptions(
  context: WebDAVClientContext,
  options: BunFetchRequestInit
) {
  const headers = new Headers(context.headers);

  if (options.headers) {
    const optionsHeaders = new Headers(options.headers);
    optionsHeaders.forEach((value, key) => headers.set(key, value));
  }

  if (context.withCredentials)
    options.credentials = 'include';

  return {
    ...options,
    headers
  };
}

export async function fetcher(
  path: string,
  context: WebDAVClientContext,
  options: BunFetchRequestInit
) {
  const url = joinURL(context.remoteURL, encodePath(path));
  const response = await fetch(url, createRequestOptions(context, options));

  if (!response.ok) {
    const data = await response.text().catch(() => null);
    const statusText = response.statusText || 'Unknown Error';
    throw new HTTPError(`HTTP Error: ${statusText}`, response.status, { url, data });
  }

  return response;
}
