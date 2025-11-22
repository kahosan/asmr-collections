import { join } from 'node:path';
import { Hono } from 'hono';
import { formatError, getVoiceLibraryEnv, hasExistsInLocal } from '~/router/utils';

export const libraryApp = new Hono();

libraryApp.get('/exists/:id', async c => {
  const { id } = c.req.param();

  try {
    const { VOICE_LIBRARY } = getVoiceLibraryEnv();

    const isExists = await hasExistsInLocal(join(VOICE_LIBRARY, id));
    return c.json({ exists: isExists });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
