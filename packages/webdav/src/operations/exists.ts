import type { WebDAVClientContext } from '../types';

import { stat } from './stat';
import { HTTPError } from '../lib/fetcher';

export async function exists(
  context: WebDAVClientContext,
  remotePath: string
): Promise<boolean> {
  try {
    await stat(context, remotePath);
    return true;
  } catch (err) {
    if (err instanceof HTTPError && err.status === 404)
      return false;

    throw err;
  }
}
