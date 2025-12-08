import type { WebDAVClientContext } from '../types';

import { HTTPError } from '@asmr-collections/shared';

import { stat } from './stat';

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
