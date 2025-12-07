import * as p from 'node:path';

import { withoutLeadingSlash } from '@asmr-collections/shared';

export function resolveSecurePath(base: string, path: string): string {
  const sanitized = withoutLeadingSlash(path);

  const fullPath = p.resolve(base, sanitized);

  const normalizedBase = p.resolve(base);
  const relativePath = p.relative(normalizedBase, fullPath);

  const safe = !relativePath.startsWith('..') && !p.isAbsolute(relativePath);

  if (!safe) throw new Error(`Access denied: Path "${path}" resolves outside base directory`);

  return fullPath;
}
