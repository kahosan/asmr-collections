import { parseURL, withLeadingSlash, withoutTrailingSlash } from '@asmr-collections/shared';

export function extractURLPath(fullURL: string): string {
  const { pathname } = parseURL(fullURL);
  return normalizePath(pathname);
}

export function normalizePath(path: string): string {
  return withoutTrailingSlash(withLeadingSlash(path));
}
