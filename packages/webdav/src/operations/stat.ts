import type { FileStat, WebDAVClientContext } from '../types';

import { encodePath, joinURL } from '@asmr-collections/shared';

import { parseStat, parseXML } from '../utils/dav';
import { createRequestOptions, HTTPError } from '../lib/fetcher';

export async function stat(
  context: WebDAVClientContext,
  filename: string
): Promise<FileStat> {
  const url = joinURL(context.remoteURL, encodePath(filename));
  const requestOptions = createRequestOptions(context, {
    method: 'PROPFIND',
    headers: {
      Accept: 'text/plain,application/xml',
      Depth: '0'
    }
  });

  const response = await fetch(url, requestOptions);
  if (!response.ok)
    throw new HTTPError(`Failed to get stat for ${filename}`, response.status);

  const text = await response.text();
  const parser = await parseXML(text, context.parsing);

  return parseStat(parser, filename);
}
