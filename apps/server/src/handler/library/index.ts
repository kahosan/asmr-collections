import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import prisma from '~/lib/db';
import { formatError, workIsExistsInLocal } from '../utils';

export const libraryApp = new Hono();

libraryApp.post('/sync', async c => {
  if (!VOICE_LIBRARY || !HOST_URL)
    return c.json({ message: '本地音声库或域名没有配置' }, 500);

  try {
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
    const successIds: string[] = [];
    for (const id of allLocalWorkIds) {
      if (!allDatabaseWorkIds.includes(id)) {
        allCreateTask.push(async () => {
          const res = await fetch(new URL(`/api/work/create/${id}`, HOST_URL), { method: 'POST' });

          if (res.ok)
            successIds.push(id);
          else
            failedIds.push(id);
        });
      }
    }

    await Promise.all(allCreateTask.map(fn => fn()));

    let text: string;
    if (successIds.length === 0) {
      if (failedIds.length === 0)
        text = '没有需要同步的音声';
      else
        text = `${failedIds.length} 个音声同步失败`;
    } else {
      text = `成功同步 ${successIds.length} 个音声`;
      if (failedIds.length > 0)
        text += `，但其中 ${failedIds.length} 个音声同步失败`;
    }

    return c.json({ message: text, data: { faileds: failedIds, successes: successIds } });
  } catch (e) {
    console.error(e);
    return c.json(formatError(e), 500);
  }
});

libraryApp.get('/exists/:id', async c => {
  const { id } = c.req.param();
  if (!VOICE_LIBRARY || !HOST_URL)
    return c.json({ message: '本地音声库或域名没有配置' }, 500);

  try {
    const isExists = await workIsExistsInLocal(join(VOICE_LIBRARY, id));
    return c.json({ exists: isExists });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
