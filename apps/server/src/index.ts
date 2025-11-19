import path, { join } from 'node:path';

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import { api } from './router/api';
import { proxyApp } from './router/proxy';
import { formatError, getVoiceLibraryEnv } from './router/utils';

const CLIENT_DIST = path.resolve(import.meta.dirname, '../../web/dist');

export const app = new Hono();

app.use(
  '*',
  logger((message, ...rest) => {
    return console.info(message, ...rest);
  })
);

app.route('/api', api);
app.route('/proxy', proxyApp);

// voice files
app.on('GET', ['/download/*', '/stream/*'], c => {
  const reqPath = c.req.path
    .replace('stream', '')
    .replace('download', '');

  try {
    const { VOICE_LIBRARY } = getVoiceLibraryEnv();

    const filePath = join(VOICE_LIBRARY, decodeURIComponent(reqPath));
    const file = Bun.file(filePath);

    let start = 0;
    const end = file.size;

    const rangeHeader = c.req.header().range;
    if (rangeHeader) {
      const array = rangeHeader.split(/bytes=(\d*)-(\d*)/);
      start = Number.parseInt(array[1], 10);

      return new Response(file.slice(start, end + 1), {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
          'Content-Length': (end - start + 1).toString(),
          'Cache-Control': 'no-cache'
        }
      });
    }

    return new Response(file, {
      headers: {
        'Content-Type': `${file.type}; charset=utf-8`,
        'Accept-Ranges': 'bytes',
        'Content-Length': file.size.toString()
      }
    });
  } catch (e) {
    return c.json(formatError(e));
  }
});

// web
app.use('/work-details/*', serveStatic({
  root: CLIENT_DIST,
  rewriteRequestPath: p => p.replace(/work-details\/.*/, '')
}));

app
  .use('/assets/*', serveStatic({ root: CLIENT_DIST }))
  .use('/*', serveStatic({ root: CLIENT_DIST }));

const port = process.env.PORT || 3000;
console.info(`Server listening on port ${port}`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 60
};
