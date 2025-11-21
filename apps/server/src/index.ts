/* eslint-disable antfu/no-top-level-await -- disabled in this file */
import * as fs from 'node:fs/promises';

import path, { join } from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { etag } from 'hono/etag';
import { logger } from 'hono/logger';
import { COVERS_PATH } from './lib/constant';
import { api } from './router';
import { proxyApp } from './router/proxy';
import { formatError, getVoiceLibraryEnv } from './router/utils';

const CLIENT_DIST = path.resolve(import.meta.dirname, '../../web/dist');
const COVERS_DIR = path.resolve(process.cwd(), 'covers');

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
app.on('GET', ['/download/*', '/stream/*'], async c => {
  const reqPath = c.req.path.replace(/^\/(?:stream|download)\//, '');

  try {
    const { VOICE_LIBRARY } = getVoiceLibraryEnv();

    const filePath = join(VOICE_LIBRARY, decodeURIComponent(reqPath));
    const file = Bun.file(filePath);

    const filename = path.basename(filePath);

    if (!(await file.exists()))
      return c.json(formatError('文件不存在'), 404);

    const fileSize = file.size;
    const lastModified = file.lastModified; // 时间戳

    // 2. 生成弱 ETag (格式: W/"size-mtime")
    // 音频文件通常很大，不要读内容算 Hash，用大小+时间戳足够了
    const etagVal = `W/"${fileSize.toString(16)}-${lastModified.toString(16)}"`;

    // 3. 检查协商缓存 (If-None-Match)
    // 如果浏览器缓存的 ETag 和我们的一样，直接返回 304
    if (c.req.header('if-none-match') === etagVal)
      return new Response(null, { status: 304 });

    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Content-Type': file.type,
      'Cache-Control': 'public, max-age=86400',
      'Last-Modified': new Date(lastModified).toUTCString(),
      'Content-Disposition': `filename="${encodeURIComponent(filename)}"`,
      ETag: etagVal
    });

    const rangeHeader = c.req.header('range');
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;

      // 边界检查
      if (start >= fileSize) {
        headers.set('Content-Range', `bytes */${fileSize}`);
        return new Response(null, { status: 416, headers });
      }

      const chunksize = (end - start) + 1;
      const fileChunk = file.slice(start, end + 1);

      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Content-Length', chunksize.toString());

      return new Response(fileChunk, {
        status: 206,
        headers
      });
    }

    headers.set('Content-Length', fileSize.toString());
    return new Response(file, {
      status: 200,
      headers
    });
  } catch (e) {
    return c.json(formatError(e));
  }
});

// cover images
app.use('/covers/*', etag());
app.use('/covers/*', serveStatic({
  root: COVERS_DIR,
  rewriteRequestPath: p => p.replace(/^\/covers/, ''),
  onFound(_, c) {
    c.header('Cache-Control', 'public, max-age=604800');
  }
}));

// web
app.use('/assets/*', etag());
app.use('/assets/*', serveStatic({
  root: CLIENT_DIST,
  onFound(_, c) {
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

app.use('*', etag());
app.use('*', serveStatic({
  root: CLIENT_DIST,
  rewriteRequestPath(path) {
    if (path.startsWith('/work-details/'))
      return '/index.html';

    return path;
  },
  onFound(path, c) {
    if (path.endsWith('.html'))
      c.header('Cache-Control', 'public, max-age=0, must-revalidate');
    else
      c.header('Cache-Control', 'public, max-age=604800');
  }
}));

// 404
app.use('*', serveStatic({
  root: CLIENT_DIST,
  rewriteRequestPath: () => '/index.html',
  onFound: (_, c) => c.header('Cache-Control', 'public, max-age=0, must-revalidate')
}));

// init
try {
  await fs.mkdir(COVERS_PATH, { recursive: true });
} catch (error) {
  console.error('Failed to create covers directory:', error);
}

const port = process.env.PORT || 3000;
console.info(`Server listening on port ${port}`);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 60
};
