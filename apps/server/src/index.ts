/* eslint-disable antfu/no-top-level-await -- disabled in this file */
import path from 'node:path';
import fs from 'node:fs/promises';

import { Hono } from 'hono';
import { etag } from 'hono/etag';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';

import { api } from './router';
import { mediaApp } from './router/media';
import { proxyApp } from './router/proxy';
import { COVERS_PATH } from './lib/constant';

const CLIENT_DIST = process.env.DIST_PATH || path.resolve(import.meta.dirname, '../../web/dist');
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
app.route('/stream', mediaApp);
app.route('/download', mediaApp);

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

// spa
const spaRoutes = ['/work-details/'];
// static files (png, ico, webmanifest)
app.use('*', etag());
app.use('*', serveStatic({
  root: CLIENT_DIST,
  rewriteRequestPath(path) {
    if (spaRoutes.some(route => path.startsWith(route)))
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
  onFound(_, c) {
    c.status(404);
    c.header('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}));

// init
try {
  await fs.mkdir(COVERS_PATH, { recursive: true });
} catch (error) {
  console.error('Failed to create covers directory:', error);
}

const port = process.env.PORT || 3000;
console.info(`Server listening on port ${port}`);

async function shutdown() {
  console.info('Shutting down server...');

  try {
    console.info('Disconnecting from database...');
    const prisma = (await import('./lib/db')).getPrisma();
    await prisma.$disconnect();
  } catch (error) {
    console.error('\nError during shutdown:', error);
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 60
};
