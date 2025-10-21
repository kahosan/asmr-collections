import type { Tracks } from '~/types/tracks';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import { exists, formatError } from '../utils';

export const tracksApp = new Hono();

tracksApp.get('/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!VOICE_LIBRARY || !HOST_URL)
      return c.json({ message: '本地音声库或域名没有配置' }, 500);

    const workPath = join(VOICE_LIBRARY, id);
    const workIsExist = await exists(workPath);
    if (!workIsExist)
      return c.json({ message: '作品不存在于本地音声库' }, 404);

    const data = await generateTracks(workPath);

    return c.json(data);
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

async function generateTracks(path: string): Promise<Tracks> {
  const entries = await readdir(path, { withFileTypes: true });

  const folders = entries
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const files = entries
    .filter(e => e.isFile())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const data: Tracks = [];

  for (const folder of folders) {
    data.push({
      type: 'folder',
      title: folder.name,
      children: await generateTracks(join(path, folder.name))
    });
  }

  for (const file of files) {
    const filePath = join(path, file.name);
    const _ft = Bun.file(filePath).type.split('/')[0] as 'video' | 'audio' | 'image' | 'text';
    const ft = _ft === 'video' ? 'audio' : _ft;

    const relativePath = path.replace(VOICE_LIBRARY!, '');

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
