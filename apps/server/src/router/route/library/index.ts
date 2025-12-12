import { join } from 'node:path';

import { Hono } from 'hono';

import { storage } from '~/storage';
import { formatError } from '~/router/utils';
import { TRANSCODE_CACHE_PATH } from '~/lib/constant';

export const libraryApp = new Hono()
  .get('/exists/:id', async c => {
    const { id } = c.req.param();

    try {
      const exists = await storage.exists(id);
      return c.json({ exists });
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  })
  .get('/ffmpeg', async c => {
    try {
      const exists = await Bun.file(join(TRANSCODE_CACHE_PATH, 'ffmpeg')).exists();
      return c.json({ exists });
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  });
