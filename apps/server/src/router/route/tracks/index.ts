import type { Track, Tracks } from '~/types/tracks';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { newQueue } from '@henrygd/queue';
import { Hono } from 'hono';
import { parseFile } from 'music-metadata';
import { match } from 'ts-pattern';
import * as z from 'zod';
import { createCachified, ttl } from '~/lib/cachified';
import { HOST_URL } from '~/lib/constant';
import { HTTPError } from '~/lib/fetcher';
import { zValidator } from '~/lib/validator';
import { formatError, getVoiceLibraryEnv, hasExistsInLocal } from '~/router/utils';

const folderQueue = newQueue(50);
const fileQueue = newQueue(50);

const [tracksCache, clearTracksCache] = createCachified<Tracks>({
  ttl: Infinity
});

export const tracksApp = new Hono();

const schema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('asmrone'),
    asmrOneApi: z.string()
  }),
  z.object({
    provider: z.undefined()
  })
]);

tracksApp.get('/:id', zValidator('query', schema), async c => {
  const { id } = c.req.param();
  const query = c.req.valid('query');

  try {
    if (query.provider === 'asmrone') {
      const { fetchAsmrOneTracks } = await import('~/provider/asmrone');
      const data = await tracksCache({
        cacheKey: `asmrone-tracks-${id}-${encodeURIComponent(query.asmrOneApi)}`,
        getFreshValue: () => fetchAsmrOneTracks(id, query.asmrOneApi),
        ttl: ttl.hour(1),
        ctx: c
      });
      return c.json(data);
    }

    const { VOICE_LIBRARY } = getVoiceLibraryEnv();

    const workPath = join(VOICE_LIBRARY, id);
    const workIsExist = await hasExistsInLocal(workPath);
    if (!workIsExist)
      return c.json({ message: '作品不存在于本地音声库' }, 404);

    const data = await tracksCache({
      cacheKey: `tracks-${id}`,
      getFreshValue: () => generateTracks(workPath, VOICE_LIBRARY),
      ctx: c
    });

    return c.json(data);
  } catch (e) {
    if (e instanceof HTTPError)
      return c.json(formatError(e), e.status);

    return c.json(formatError(e), 500);
  }
});

const schemaClearCache = z.object({
  asmrOneApi: z.string(),
  local: z.coerce.boolean()
});

tracksApp.post('/:id/cache/clear', zValidator('query', schemaClearCache), async c => {
  const { id } = c.req.param();
  const { asmrOneApi, local } = c.req.valid('query');

  try {
    const encodedAsmrOneApi = encodeURIComponent(asmrOneApi);

    if (!local) {
      await clearTracksCache(`asmrone-tracks-${id}-${encodedAsmrOneApi}`);
      return c.json({ message: `${id} 缓存已清除` });
    }

    // check voice library env
    getVoiceLibraryEnv();

    await clearTracksCache(`tracks-${id}`);
    await clearTracksCache(`asmrone-tracks-${id}-${encodedAsmrOneApi}`);
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
