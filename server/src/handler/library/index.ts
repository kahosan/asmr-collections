import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import prisma from '~/lib/db';
import { exists, formatError } from '../utils';

export const libraryApp = new Hono();

libraryApp.post('/sync', async c => {
  if (!VOICE_LIBRARY || !HOST_URL)
    return c.json({ message: '本地音声库或域名没有配置' }, 500);

  const allLocalWorkIds = await readdir(VOICE_LIBRARY, { withFileTypes: true }).then(dir => {
    const ids = [];
    for (const files of dir) {
      if (files.isDirectory() && /^(?:RJ|BJ|VJ)\d{6,8}$/.test(files.name))
        ids.push(files.name);
    }

    return ids;
  });

  const allDatabaseWorkIds = await prisma.work.findMany({ select: { id: true } })
    .then(ids => ids.map(id => id.id));

  const allCreateTask = [];

  const failedIds: string[] = [];
  for (const id of allLocalWorkIds) {
    if (!allDatabaseWorkIds.includes(id)) {
      allCreateTask.push(async () => {
        const res = await fetch(new URL(`/api/work/create/${id}`, HOST_URL), { method: 'POST' });

        if (!res.ok)
          failedIds.push(id);
      });
    }
  }

  await Promise.all(allCreateTask.map(fn => fn()));

  const text = failedIds.length > 0 ? '同步错误' : '同步成功';

  return c.json({ message: text, data: failedIds });
});

libraryApp.get('/exist/:id', async c => {
  const { id } = c.req.param();
  if (!VOICE_LIBRARY || !HOST_URL)
    return c.json({ message: '本地音声库或域名没有配置' }, 500);

  try {
    const isExist = await exists(join(VOICE_LIBRARY, id));
    return c.json({ exist: isExist });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
