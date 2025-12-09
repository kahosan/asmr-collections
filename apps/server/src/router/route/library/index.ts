import { Hono } from 'hono';

import { storage } from '~/storage';
import { formatError } from '~/router/utils';

export const libraryApp = new Hono();

libraryApp.get('/exists/:id', async c => {
  const { id } = c.req.param();

  try {
    const exists = await storage.exists(id);
    return c.json({ exists });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
