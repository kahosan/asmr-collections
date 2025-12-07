import type { CreateReadableStreamOptions, WebDAVClientContext } from '../types';

import { encodePath, joinURL } from '@asmr-collections/shared';

import { createRequestOptions, HTTPError } from '../lib/fetcher';

export async function createReadableStream(
  context: WebDAVClientContext,
  filename: string,
  options?: CreateReadableStreamOptions
): Promise<ReadableStream> {
  const { remoteURL } = context;

  const headers = new Headers();
  if (typeof options?.start === 'number')
    headers.set('Range', `bytes=${options.start}-${options.end ?? ''}`);

  const url = joinURL(remoteURL, encodePath(filename));
  const requestOptions = createRequestOptions(context, {
    method: 'GET',
    headers
  });

  const response = await fetch(url, requestOptions);

  // if content start is 0, response is full content
  const allow200 = options?.start === 0;

  if (!response.ok)
    throw new HTTPError(`无法读取文件 ${filename}，HTTP Code：${response.status}`, response.status);

  if (headers.get('Range') && (response.status !== 206 && !allow200))
    throw new HTTPError('WebDAV Server 不支持 Range 请求', response.status);

  if (!response.body)
    throw new HTTPError(`响应为空，无法读取文件 ${filename}，HTTP Code：${response.status}`, response.status);

  return response.body;
}
