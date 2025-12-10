import type { DAVResult, FileStat, GetDirectoryContentsOptions, WebDAVClientContext } from '../types';

import path from 'node:path/posix';

import { HTTPError, withLeadingSlash, withoutHost } from '@asmr-collections/shared';

import { fetcher } from '../lib/fetcher';
import { normalizePath } from '../utils';
import { parseXML, prepareFileFromProps } from '../utils/dav';

export async function getDirectoryContents(
  context: WebDAVClientContext,
  remotePath: string,
  options?: GetDirectoryContentsOptions
) {
  const response = await fetcher(remotePath, context, {
    method: 'PROPFIND',
    headers: {
      Accept: 'text/plain,application/xml',
      Depth: options?.deep ? 'infinity' : '1'
    }
  });

  const text = await response.text();

  if (!text)
    throw new HTTPError(`Empty response when getting directory contents for ${remotePath}`, response.status, { remotePath, options });

  const resp = await parseXML(text, context.parsing);

  const filesRemotePath = withLeadingSlash(remotePath);
  const filesRemoteBasePath = withLeadingSlash(context.remoteBasePath || context.remotePath);

  return getDirectoryFiles(
    resp,
    filesRemoteBasePath,
    filesRemotePath,
    options?.includeSelf
  );
}

function getDirectoryFiles(
  result: DAVResult,
  serverRemoteBasePath: string,
  requestPath: string,
  includeSelf = false
): FileStat[] {
  const serverBase = path.join(serverRemoteBasePath, '/');
  // Extract the response items (directory contents)
  const {
    multistatus: { response: responseItems }
  } = result;

  // Map all items to a consistent output structure (results)
  const nodes = responseItems.map(item => {
    // HREF is the file path (in full) - The href is already XML entities decoded (e.g. foo&amp;bar is reverted to foo&bar)
    const href = withoutHost(item.href);
    // Each item should contain a stat object
    const { propstat } = item;
    const props = propstat?.prop;
    // Process the true full filename (minus the base server path)
    const filename =
      serverBase === '/'
        ? decodeURIComponent(normalizePath(href))
        : normalizePath(
          path.relative(decodeURIComponent(serverBase), decodeURIComponent(href))
        );

    // 来源就没处理 undefined 的可能.
    return prepareFileFromProps(props!, filename);
  });

  // If specified, also return the current directory
  if (includeSelf)
    return nodes;

  // Else, filter out the item pointing to the current directory (not needed)
  return nodes.filter(
    item => item.basename
      && (item.type === 'file' || item.filename !== requestPath.replace(/\/$/, ''))
  );
}
