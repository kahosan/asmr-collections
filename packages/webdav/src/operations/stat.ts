import type { FileStat, WebDAVClientContext } from '../types';

import { parseStat, parseXML } from '../utils/dav';
import { fetcher, HTTPError } from '../lib/fetcher';

export async function stat(
  context: WebDAVClientContext,
  filename: string
): Promise<FileStat> {
  const response = await fetcher(filename, context, {
    method: 'PROPFIND',
    headers: {
      Accept: 'text/plain,application/xml',
      Depth: '0'
    }
  });

  const text = await response.text();

  if (!text)
    throw new HTTPError(`Empty response when getting file stats for ${filename}`, response.status);

  const parser = await parseXML(text, context.parsing);

  return parseStat(parser, filename);
}
