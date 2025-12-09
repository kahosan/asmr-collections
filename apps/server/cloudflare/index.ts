import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { api } from '../src/router';
import { proxyApp } from '../src/router/proxy';

interface Bindings {
  ASSETS: {
    fetch: typeof fetch
  }
}

export const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '*',
  logger((message, ...rest) => {
    return console.info(message, ...rest);
  })
);

app.route('/api', api);
app.route('/proxy', proxyApp);

// web
app.get('/work-details/*', c => {
  return c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
});

app.get('/settings*', c => {
  return c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
});

export default {
  fetch: app.fetch,
  idleTimeout: 60
};
