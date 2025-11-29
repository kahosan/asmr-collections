import type { PathLike } from 'node:fs';

import { stat } from 'node:fs/promises';

export async function exists(path: PathLike): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
