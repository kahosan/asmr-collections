import type { PathLike } from 'node:fs';

import { extname as en } from 'pathe';

export * from 'pathe/utils';

export function extname(path: string, dot = false): string {
  if (!dot) return en(path).slice(1);
  return en(path);
};

export async function exists(path: PathLike): Promise<boolean> {
  const { stat } = await import('node:fs/promises');

  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
