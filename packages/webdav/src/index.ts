import type { WebDAVClient, WebDAVClientContext, WebDAVClientOptions } from './types';

import { setupAuth } from './auth';
import { AuthType } from './types';
import { stat } from './operations/stat';
import { extractURLPath } from './utils';
import { exists } from './operations/exists';
import { displaynameTagParser } from './utils/dav';
import { createReadableStream } from './operations/create-stream';
import { getDirectoryContents } from './operations/get-directory-contents';

const DEFAULT_CONTACT_HREF =
  'https://github.com/perry-mitchell/webdav-client/blob/master/LOCK_CONTACT.md';

export function createClient(remoteURL: string, options: WebDAVClientOptions = {}): WebDAVClient {
  const {
    remoteBasePath,
    contactHref = DEFAULT_CONTACT_HREF,
    ha1,
    headers,
    password,
    username,
    token,
    withCredentials,
    attributeNamePrefix
  } = options;

  let { authType } = options;
  if (authType === undefined)
    authType = (username || password) ? AuthType.Password : AuthType.None;

  const context: WebDAVClientContext = {
    authType,
    remoteBasePath,
    contactHref,
    ha1,
    headers: headers ?? new Headers(),
    password,
    parsing: {
      attributeNamePrefix: attributeNamePrefix ?? '@',
      attributeParsers: [],
      tagParsers: [displaynameTagParser]
    },
    remotePath: extractURLPath(remoteURL),
    remoteURL,
    username,
    token,
    withCredentials
  };

  setupAuth(context, username, password, token, ha1);

  return {
    createReadableStream: (filename, options) => createReadableStream(context, filename, options),
    getDirectoryContents: (path, options) => getDirectoryContents(context, path, options),
    stat: path => stat(context, path),
    exists: path => exists(context, path)
  };
}

export * from './types';
