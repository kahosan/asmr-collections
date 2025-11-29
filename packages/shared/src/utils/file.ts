import { extname as en } from 'pathe';

export * from 'pathe/utils';

export function extname(path: string, dot = false): string {
  if (!dot) return en(path).slice(1);
  return en(path);
};
