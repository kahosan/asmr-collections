import type { PathLike } from 'node:fs';

import { access } from 'node:fs/promises';

export async function exists(path: PathLike): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
