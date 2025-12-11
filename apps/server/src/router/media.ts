import { Hono } from 'hono';

import { storage } from '~/storage';

import { formatError, formatMessage } from './utils';

export const mediaApp = new Hono();

mediaApp.get('/:path{.+}', async c => {
  const path = c.req.param('path');

  try {
    const decodePath = decodeURIComponent(path);
    const file = await storage.file(decodePath);

    if (!file)
      return c.json(formatMessage('文件不存在'), 404);

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
      'Content-Disposition': `filename="${encodeURIComponent(file.name)}"`,
      ETag: etagVal
    });

    const rangeHeader = c.req.header('range');
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      // gemini 说这里可能是 NaN，如果是 bytes=-500，parts 为 ['', '500']，暂时没遇到过这种情况，以后再说
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;

      // 边界检查
      if (start >= fileSize) {
        headers.set('Content-Range', `bytes */${fileSize}`);
        return new Response(null, { status: 416, headers });
      }

      const chunksize = (end - start) + 1;
      const chunk = file.chunk?.(start, end) ?? await file.stream(start, end);

      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Content-Length', chunksize.toString());

      return new Response(chunk, {
        status: 206,
        headers
      });
    }

    headers.set('Content-Length', fileSize.toString());
    return new Response(file.raw ?? await file.stream(), {
      status: 200,
      headers
    });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
