import type { WebDAVClientContext } from '../types';

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
    optionsHeaders.forEach((value, key) => headers.append(key, value));
  }

  if (context.withCredentials)
    options.credentials = 'include';

  return {
    ...options,
    headers
  };
}
