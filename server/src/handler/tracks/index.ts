import type { Tracks } from '~/types/tracks';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { newQueue } from '@henrygd/queue';
import { Hono } from 'hono';
import { match } from 'ts-pattern';
import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import { formatError, workIsExistsInLocal } from '../utils';

const queue = newQueue(50);

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

    const data = await generateTracks(workPath, VOICE_LIBRARY);

    return c.json(data);
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

  const data: Tracks = [];

  const folderTracks = await queue.all(
    folders
      .map(folder => generateTracks(join(path, folder.name), basePath)
        .then(children => ({ type: 'folder' as const, title: folder.name, children })))
  );

  data.push(...folderTracks);

  for (const file of files) {
    const _ft = extname(file.name);
    const ft = match(_ft.toLowerCase())
      .with('.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.opus', () => 'audio' as const)
      .with('.mp4', '.mkv', '.avi', '.mov', () => 'audio' as const)
      .with('.srt', '.vtt', '.lrc', () => 'text' as const)
      .with('.jpg', '.jpeg', '.png', '.gif', '.webp', () => 'image' as const)
      .otherwise(() => 'other' as const);

    const relativePath = path.replace(basePath, '');

    data.push({
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
    });
  }

  return data;
}
