import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { rename, utimes } from 'node:fs/promises';

import { Hono } from 'hono';

import { createFFmpegProc } from '~/lib/ffmpeg';
import { BunFileToAdapterFile, storage } from '~/storage';
import { TRANSCODE_CACHE_PATH, TRANSCODE_FORMATS } from '~/lib/constant';

import { formatError, formatMessage } from './utils';

const transcodeTasks = new Map<string, Promise<void>>();
const transcodeErrors = new Map<string, Error>();

export const mediaApp = new Hono();

function getCacheKey(path: string, mtime: number, bitrate: number) {
  const hash = createHash('md5')
    .update(`${path}-${mtime}-${bitrate}`)
    .digest('hex');
  return `${hash}.m4a`;
}

mediaApp.get('/:path{.+}', async c => {
  const path = c.req.param('path');
  const _bitrate = c.req.query('bitrate');

  try {
    const decodePath = decodeURIComponent(path);
    const adapter = await storage.find(decodePath);

    if (!adapter)
      return c.json(formatMessage('文件不存在'), 404);

    let file = await adapter.file(decodePath);

    if (
      _bitrate
      && adapter.type === 'local'
      && TRANSCODE_FORMATS.some(format => file.name.endsWith(format))
    ) {
      const bitrate = Number.parseInt(_bitrate, 10);

      if (Number.isNaN(bitrate) || bitrate < 32 || bitrate > 512) {
        return c.body(null, 400, {
          'X-Transcode-Status': encodeURIComponent('无效的比特率参数')
        });
      }

      const cacheKey = getCacheKey(decodePath, file.lastModified, bitrate);
      const cachePath = join(TRANSCODE_CACHE_PATH, cacheKey);
      const tempPath = `${cachePath}.tmp`;

      const filename = file.name.replace(/\.[^.]+$/, '.m4a');

      if (transcodeTasks.has(cachePath)) {
        return c.body(null, 202, {
          'X-Transcode-Status': encodeURIComponent(`正在转码：${file.name} -> AAC ${bitrate}k`)
        });
      }

      const taskError = transcodeErrors.get(cachePath);
      if (taskError) {
        transcodeErrors.delete(cachePath);
        return c.body(null, 500, {
          'X-Transcode-Status': encodeURIComponent(taskError.message)
        });
      }

      const cacheFile = Bun.file(cachePath);

      if (await cacheFile.exists()) {
        // 更新缓存的 mtime，成为热点文件
        utimes(cachePath, new Date(), new Date()).catch(() => { /* 忽略错误 */ });
        file = BunFileToAdapterFile(cacheFile, filename, cachePath);
      } else {
        console.log(`开始转码: ${file.name} -> AAC ${bitrate}k`);

        const taskExecutor = async () => {
          let proc: ReturnType<typeof createFFmpegProc> | null = null;

          try {
            proc = createFFmpegProc(bitrate, file.path, tempPath);
            await proc.exited;

            if (proc.exitCode !== 0) throw new Error('FFmpeg 转码出错');

            await rename(tempPath, cachePath);
            console.log(`转码完成: ${file.name} -> AAC ${bitrate}k`);
          } catch (e) {
            proc?.kill();
            console.error(`转码失败: ${file.name} -> AAC ${bitrate}k`, e);
            Bun.file(tempPath).delete().catch(() => { /* 忽略删除错误 */ });

            if (e instanceof Error)
              transcodeErrors.set(cachePath, e);
          }
        };

        const task = taskExecutor();
        transcodeTasks.set(cachePath, task);
        task.finally(() => transcodeTasks.delete(cachePath));

        return c.body(null, 202, {
          'X-Transcode-Status': encodeURIComponent(`正在转码：${file.name} -> AAC ${bitrate}k`)
        });
      }
    }

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
      let start = Number.parseInt(parts[0], 10);
      let end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;

      if (Number.isNaN(start)) {
        // parts[1] 是请求的最后 N 个字节
        const suffixLength = Number.parseInt(parts[1], 10);
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
      }

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
