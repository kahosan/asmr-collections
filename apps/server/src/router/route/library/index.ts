import { join } from 'node:path';

import { Hono } from 'hono';
import { exists } from '@asmr-collections/shared';

import { formatError, getVoiceLibraryEnv } from '~/router/utils';

export const libraryApp = new Hono();

libraryApp.get('/exists/:id', async c => {
  const { id } = c.req.param();

  try {
    const { VOICE_LIBRARY } = getVoiceLibraryEnv();

    const isExists = await exists(join(VOICE_LIBRARY, id));
    return c.json({ exists: isExists });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
