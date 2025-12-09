import type { IAudioMetadata } from 'music-metadata';
import type { Track, Tracks } from '@asmr-collections/shared';

import type { StorageAdapter } from '~/types/storage/adapters';

import { Readable } from 'node:stream';
import { extname, join } from 'node:path';

import { Hono } from 'hono';
import { match } from 'ts-pattern';
import { newQueue } from '@henrygd/queue';
import { parseFile, parseStream } from 'music-metadata';
import { HTTPError, joinURL } from '@asmr-collections/shared';

import * as z from 'zod';

import { storage } from '~/storage';
import { zValidator } from '~/lib/validator';
import { formatError } from '~/router/utils';
import { createCachified, ttl } from '~/lib/cachified';

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

    const adapter = await storage.find(id);
    if (!adapter)
      return c.json({ message: '作品不存在于本地音声库' }, 404);

    const data = await tracksCache({
      cacheKey: `tracks-${id}`,
      getFreshValue: () => generateTracks(id, adapter),
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

    await clearTracksCache(`tracks-${id}`);
    await clearTracksCache(`asmrone-tracks-${id}-${encodedAsmrOneApi}`);
    return c.json({ message: `${id} 缓存已清除` });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

async function generateTracks(path: string, adapter: StorageAdapter): Promise<Tracks> {
  const entries = await adapter.readdir(path);

  const folders = entries
    .filter(e => e.type === 'directory')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const files = entries
    .filter(e => e.type === 'file')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const [folderTracks, fileTracks] = await Promise.all([
    folderQueue.all(
      folders
        .map(folder => generateTracks(join(path, folder.name), adapter)
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
          mediaDownloadUrl: joinURL('/download', path, file.name),
          mediaStreamUrl: joinURL('/stream', path, file.name)
        };

        if (ft === 'audio') {
          try {
            const AUDIO_HEADER_SIZE = 512 * 1024; // 512KB
            let metadata: IAudioMetadata | undefined;

            if (adapter.type === 'local') {
              const _f = await adapter.file(join(path, file.name));
              const filepath = _f.path;

              metadata = await parseFile(filepath, {
                skipCovers: true,
                duration: true
              });
            } else {
              const _f = await adapter.file(join(path, file.name));
              const head = await _f.stream(0, AUDIO_HEADER_SIZE);

              metadata = await parseStream(Readable.fromWeb(head));
            }

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
