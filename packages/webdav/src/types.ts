export type AuthHeader = string;

export const AuthType = {
  Auto: 'auto',
  Digest: 'digest',
  None: 'none',
  Password: 'password',
  Token: 'token'
} as const;

export type AuthType = (typeof AuthType)[keyof typeof AuthType];

export interface CreateReadableStreamOptions {
  start?: number
  end?: number
}

/** <propstat> as per http://www.webdav.org/specs/rfc2518.html#rfc.section.12.9.1.1 */
interface DAVPropStat {
  prop: DAVResultResponseProps
  status: string
  responsedescription?: string
}

/**
 * DAV response can either be (href, propstat, responsedescription?) or (href, status, responsedescription?)
 * @see http://www.webdav.org/specs/rfc2518.html#rfc.section.12.9.1
 */
interface DAVResultBaseResponse {
  href: string
  responsedescription?: string
}

export interface DAVResultPropstatResponse extends DAVResultBaseResponse {
  propstat: DAVPropStat
}

export interface DAVResultStatusResponse extends DAVResultBaseResponse {
  status: string
}

export type DAVResultResponse = DAVResultBaseResponse
  & Partial<DAVResultPropstatResponse>
  & Partial<DAVResultStatusResponse>;

export interface DAVResultResponseProps {
  displayname: string
  resourcetype: {
    collection?: unknown
  }
  getlastmodified?: string
  getetag?: string
  getcontentlength?: string
  getcontenttype?: string
  'quota-available-bytes'?: string | number
  'quota-used-bytes'?: string | number

  [additionalProp: string]: unknown
}

export interface DAVResult {
  multistatus: {
    response: DAVResultResponse[]
  }
}

export interface DAVResultRawMultistatus {
  response: DAVResultResponse | [DAVResultResponse]
}

export interface DAVResultRaw {
  multistatus: '' | DAVResultRawMultistatus | [DAVResultRawMultistatus]
}

export interface DigestContext {
  username: string
  password: string
  nc: number
  algorithm: string
  hasDigestAuth: boolean
  cnonce?: string
  nonce?: string
  realm?: string
  qop?: string
  opaque?: string
  ha1?: string
}

export const ErrorCode = {
  DataTypeNoLength: 'data-type-no-length',
  InvalidAuthType: 'invalid-auth-type',
  InvalidOutputFormat: 'invalid-output-format',
  LinkUnsupportedAuthType: 'link-unsupported-auth',
  InvalidUpdateRange: 'invalid-update-range',
  NotSupported: 'not-supported'
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface FileStat {
  filename: string
  basename: string
  lastmod: string
  size: number
  type: 'file' | 'directory'
  etag: string | null
  mime?: string
}

export interface WebDAVClient {
  createReadableStream: (filename: string, options?: CreateReadableStreamOptions) => Promise<ReadableStream>
  getDirectoryContents(path: string, options?: GetDirectoryContentsOptions): Promise<FileStat[]>
  stat: (path: string) => Promise<FileStat>
  exists: (path: string) => Promise<boolean>
}

export interface WebDAVClientContext {
  authType: AuthType
  remoteBasePath?: string
  contactHref: string
  digest?: DigestContext
  ha1?: string
  headers: Headers
  parsing: WebDAVParsingContext
  password?: string
  remotePath: string
  remoteURL: string
  token?: OAuthToken
  username?: string
  withCredentials?: boolean
}

export interface OAuthToken {
  access_token: string
  token_type: string
  refresh_token?: string
}

export interface WebDAVClientOptions {
  attributeNamePrefix?: string
  authType?: AuthType
  remoteBasePath?: string
  contactHref?: string
  ha1?: string
  headers?: Headers
  maxBodyLength?: number
  maxContentLength?: number
  password?: string
  token?: OAuthToken
  username?: string
  withCredentials?: boolean
}

export interface GetDirectoryContentsOptions {
  deep?: boolean
  includeSelf?: boolean
}

/**
 * Callback to parse a prop attribute value.
 * If `undefined` is returned the original text value will be used.
 * If the unchanged value is returned the default parsing will be applied.
 * Otherwise the returned value will be used.
 */
export type WebDAVAttributeParser = (
  jPath: string,
  attributeValue: string
) => string | unknown | undefined;

/**
 * Callback to parse a prop tag value.
 * If `undefined` is returned the original text value will be used.
 * If the unchanged value is returned the default parsing will be applied.
 * Otherwise the returned value will be used.
 */
export type WebDAVTagParser = (jPath: string, tagValue: string) => string | unknown | undefined;

export interface WebDAVParsingContext {
  attributeNamePrefix?: string
  attributeParsers: WebDAVAttributeParser[]
  tagParsers: WebDAVTagParser[]
}
