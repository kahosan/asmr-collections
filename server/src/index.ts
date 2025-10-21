import path, { join } from 'node:path';

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { formatError } from './handler/utils';
import { VOICE_LIBRARY } from './lib/constant';
import { api } from './router/api';
import { proxyApp } from './router/proxy';

const root = path.resolve(import.meta.dirname, '../dist');

export const app = new Hono();

app.route('/api', api);
app.route('/proxy', proxyApp);

// voice files
app.on('GET', ['/download/*', '/stream/*'], c => {
  if (!VOICE_LIBRARY)
    return c.json({ message: '本地音声库没有配置' }, 500);

  const reqPath = c.req.path
    .replace('stream', '')
    .replace('download', '');

  try {
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
  root,
  rewriteRequestPath: p => p.replace(/work-details\/.*/, '')
}));

app
  .use('/assets/*', serveStatic({ root }))
  .use('/*', serveStatic({ root }));

const port = process.env.PORT || 3000;
console.info(`Server listening on port ${port}`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 60
};
