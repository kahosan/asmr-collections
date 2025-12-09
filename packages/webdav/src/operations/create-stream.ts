import type { CreateReadableStreamOptions, WebDAVClientContext } from '../types';

import { HTTPError } from '@asmr-collections/shared';

import { fetcher } from '../lib/fetcher';

export async function createReadableStream(
  context: WebDAVClientContext,
  filename: string,
  options?: CreateReadableStreamOptions
): Promise<ReadableStream> {
  const headers = new Headers();
  if (typeof options?.start === 'number')
    headers.set('Range', `bytes=${options.start}-${options.end ?? ''}`);

  const response = await fetcher(filename, context, {
    method: 'GET',
    headers
  });

  // if content start is 0, response is full content
  const allow200 = options?.start === 0;

  if (headers.get('Range') && (response.status !== 206 && !allow200))
    throw new HTTPError('WebDAV Server 不支持 Range 请求', response.status, { filename, options });

  if (!response.body)
    throw new HTTPError(`响应为空，无法读取文件 ${filename}`, response.status, { filename, options });

  return response.body;
}
