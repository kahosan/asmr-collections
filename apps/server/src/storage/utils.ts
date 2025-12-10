import * as p from 'node:path';
import * as pp from 'node:path/posix';

import { withoutLeadingSlash } from '@asmr-collections/shared';

export function resolveSecurePath(base: string, targetPath: string, posix = false): string {
  const path = posix ? pp : p;

  const normalizedBase = path.resolve(base);

  const sanitized = withoutLeadingSlash(targetPath);

  const fullPath = path.resolve(normalizedBase, sanitized);

  const relativePath = path.relative(normalizedBase, fullPath);

  // Ensure the resolved path is within the base directory
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath))
    throw new Error(`Access denied: Path "${targetPath}" resolves outside base directory`);

  return fullPath;
}
