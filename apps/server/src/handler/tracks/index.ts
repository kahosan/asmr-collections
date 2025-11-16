import type { Track, Tracks } from '~/types/tracks';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { newQueue } from '@henrygd/queue';
import { Hono } from 'hono';
import { parseFile } from 'music-metadata';
import { match } from 'ts-pattern';
import { createCachified } from '~/lib/cachified';
import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import { formatError, workIsExistsInLocal } from '../utils';

const folderQueue = newQueue(50);
const fileQueue = newQueue(50);

const [tracksCache, clearTracksCache] = createCachified<Tracks>({
  ttl: Infinity
});

export const tracksApp = new Hono();

tracksApp.get('/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!VOICE_LIBRARY || !HOST_URL)
      return c.json({ message: '本地音声库或域名没有配置' }, 500);

    const workPath = join(VOICE_LIBRARY, id);
    const workIsExist = await workIsExistsInLocal(workPath);
    if (!workIsExist)
      return c.json({ message: '作品不存在于本地音声库' }, 404);

    const data = await tracksCache({
      cacheKey: `tracks-${id}`,
      getFreshValue: () => generateTracks(workPath, VOICE_LIBRARY!),
      ctx: c
    });

    return c.json(data);
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

tracksApp.post('/:id/cache/clear', async c => {
  const { id } = c.req.param();

  try {
    if (!VOICE_LIBRARY || !HOST_URL)
      return c.json({ message: '本地音声库或域名没有配置' }, 500);

    await clearTracksCache(`tracks-${id}`);
    return c.json({ message: `${id} 缓存已清除` });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

async function generateTracks(path: string, basePath: string): Promise<Tracks> {
  const entries = await readdir(path, { withFileTypes: true });

  const folders = entries
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const files = entries
    .filter(e => e.isFile())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const relativePath = path.replace(basePath, '');

  const [folderTracks, fileTracks] = await Promise.all([
    folderQueue.all(
      folders
        .map(folder => generateTracks(join(path, folder.name), basePath)
          .then(children => ({ type: 'folder' as const, title: folder.name, children })))
    ),
    fileQueue.all(
      files.map(async file => {
        const _ft = extname(file.name);
        const ft = match(_ft.toLowerCase())
          .with('.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.opus', () => 'audio' as const)
          .with('.mp4', '.mkv', '.avi', '.mov', () => 'audio' as const)
          .with('.srt', '.vtt', '.lrc', () => 'text' as const)
          .with('.jpg', '.jpeg', '.png', '.gif', '.webp', () => 'image' as const)
          .otherwise(() => 'other' as const);

        const item: Track = {
          type: ft,
          title: file.name,
          mediaDownloadUrl: new URL(
            `/download${relativePath}/${encodeURIComponent(file.name)}`,
            HOST_URL
          ).toString(),
          mediaStreamUrl: new URL(
            `/stream${relativePath}/${encodeURIComponent(file.name)}`,
            HOST_URL
          ).toString()
        };

        if (ft === 'audio') {
          try {
            const metadata = await parseFile(join(path, file.name), {
              skipCovers: true,
              duration: true
            });
            const duration = metadata.format.duration;
            if (duration)
              item.duration = duration;
          } catch (e) {
            console.warn(`无法解析音频文件元数据: ${join(path, file.name)}, 错误信息: ${(e as Error).message}`);
          }
        }

        return item;
      })
    )
  ]);

  return [...folderTracks, ...fileTracks];
}
