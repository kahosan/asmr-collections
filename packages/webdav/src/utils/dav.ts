import type { DAVResult, DAVResultPropstatResponse, DAVResultRaw, DAVResultResponse, DAVResultResponseProps, FileStat, WebDAVParsingContext } from '../types';

import path from 'node:path/posix';

import { XMLParser } from 'fast-xml-parser';
import { getProperty, setProperty } from 'dot-prop';
import { HTTPError } from '@asmr-collections/shared';

import { normalizePath } from '.';

type PropertyType = typeof PropertyType[keyof typeof PropertyType];
const PropertyType = {
  Array: 'array',
  Object: 'object',
  Original: 'original'
} as const;

function getParser({
  attributeNamePrefix,
  attributeParsers,
  tagParsers
}: WebDAVParsingContext): XMLParser {
  return new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix,
    textNodeName: 'text',
    ignoreAttributes: false,
    removeNSPrefix: true,
    numberParseOptions: {
      hex: true,
      leadingZeros: false
    },
    attributeValueProcessor(_, attrValue, jPath) {
      for (const processor of attributeParsers) {
        try {
          const value = processor(jPath, attrValue);
          if (value !== attrValue)
            return value;
        } catch {
          // skipping this invalid parser
        }
      }
      return attrValue;
    },
    tagValueProcessor(_tagName, tagValue, jPath) {
      for (const processor of tagParsers) {
        try {
          const value = processor(jPath, tagValue);
          if (value !== tagValue)
            return value;
        } catch {
          // skipping this invalid parser
        }
      }
      return tagValue;
    }
  });
}

/**
 * Tag parser for the displayname prop.
 * Ensure that the displayname is not parsed and always handled as is.
 * @param path The jPath of the tag
 * @param value The text value of the tag
 */
export function displaynameTagParser(path: string, value: string): string | void {
  if (path.endsWith('propstat.prop.displayname')) {
    // Do not parse the displayname, because this causes e.g. '2024.10' to result in number 2024.1
    return;
  }
  return value;
}

function getPropertyOfType(
  obj: object,
  prop: string,
  type: PropertyType = PropertyType.Original
) {
  const val = getProperty(obj, prop);
  if (type === 'array' && !Array.isArray(val))
    return [val];
  if (type === 'object' && Array.isArray(val))
    return val[0];

  return val;
}

function normalizeResponse(response: DAVResultResponse): DAVResultResponse {
  const output = Object.assign({}, response);
  // Only either status OR propstat is allowed
  if (output.status) {
    setProperty(output, 'status', getPropertyOfType(output, 'status', PropertyType.Object));
  } else {
    setProperty(
      output,
      'propstat',
      getPropertyOfType(output, 'propstat', PropertyType.Object)
    );
    setProperty(
      output,
      'propstat.prop',
      getPropertyOfType(output, 'propstat.prop', PropertyType.Object)
    );
  }
  return output;
}

function normaliseResult({ multistatus }: DAVResultRaw): DAVResult {
  if (multistatus === '') {
    return {
      multistatus: {
        response: []
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TS sometimes thinks multistatus can be undefined here
  if (!multistatus)
    throw new Error('Invalid response: No root multistatus found');

  const output = {
    multistatus: Array.isArray(multistatus) ? multistatus[0] : multistatus
  };

  const value: DAVResultResponse[] = getPropertyOfType(output, 'multistatus.response', PropertyType.Array);

  setProperty(
    output,
    'multistatus.response',
    value.map(response => normalizeResponse(response))
  );

  return output as DAVResult;
}

/**
 * Parse an XML response from a WebDAV service,
 *  converting it to an internal DAV result
 * @param xml The raw XML string
 * @param context The current client context
 * @returns A parsed and processed DAV result
 */
export function parseXML(xml: string, context?: WebDAVParsingContext): Promise<DAVResult> {
  // backwards compatibility as this method is exported from the package
  context = context ?? {
    attributeNamePrefix: '@',
    attributeParsers: [],
    tagParsers: [displaynameTagParser]
  };
  return new Promise(resolve => {
    const result = getParser(context).parse(xml);
    resolve(normaliseResult(result));
  });
}

/**
 * Get a file stat result from given DAV properties
 * @param props DAV properties
 * @param filename The filename for the file stat
 * @returns A file stat result
 */
export function prepareFileFromProps(
  props: DAVResultResponseProps,
  filename: string
): FileStat {
  // Last modified time, raw size, item type and mime
  const {
    getlastmodified: lastMod = null,
    getcontentlength: rawSize = '0',
    resourcetype: resourceType = null,
    getcontenttype: mimeType = null,
    getetag: etag = null
  } = props;
  const type =
    resourceType
    && typeof resourceType === 'object'
    && typeof resourceType.collection !== 'undefined'
      ? 'directory'
      : 'file';
  const stat: FileStat = {
    filename,
    basename: path.basename(filename),
    lastmod: lastMod || '',
    size: Number.parseInt(rawSize, 10),
    type,
    etag: typeof etag === 'string' ? etag.replaceAll('"', '') : null
  };
  if (type === 'file')
    stat.mime = mimeType && typeof mimeType === 'string' ? mimeType.split(';')[0] : '';

  return stat;
}

/**
 * Parse a DAV result for file stats
 * @param result The resulting DAV response
 * @param filename The filename that was stat'd
 *  the resource should be returned
 * @returns A file stat result
 */
export function parseStat(
  result: DAVResult,
  filename: string
): FileStat {
  let responseItem: DAVResultPropstatResponse | null = null;

  try {
    // should be a propstat response, if not the if below will throw an error
    if ((result.multistatus.response[0]).propstat)
      responseItem = result.multistatus.response[0] as DAVResultPropstatResponse;
  } catch {
    /* ignore */
  }

  if (!responseItem)
    throw new Error('Failed getting item stat: bad response');

  const {
    propstat: { prop: props, status: statusLine }
  } = responseItem;

  // As defined in https://tools.ietf.org/html/rfc2068#section-6.1
  const [_, statusCodeStr, statusText] = statusLine.split(' ', 3);
  const statusCode = Number.parseInt(statusCodeStr, 10);

  if (statusCode >= 400)
    throw new HTTPError(`Invalid response: ${statusCode} ${statusText}`, statusCode);

  const filePath = normalizePath(filename);
  return prepareFileFromProps(props, filePath);
}
