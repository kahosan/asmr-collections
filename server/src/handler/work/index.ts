import { fileTypeFromBuffer } from 'file-type';

import { Hono } from 'hono';

import prisma from '~/lib/db';
import { formatError, workIsExistsInDB } from '../utils';

import { batchApp } from './batch';
import { createApp } from './create';
import { deleteApp } from './delete';
import { infoApp } from './info';
import { similarApp } from './similar';
import { updateApp } from './update';

export const workApp = new Hono()
  .route('/', createApp)
  .route('/', deleteApp)
  .route('/', infoApp)
  .route('/', updateApp)
  .route('/', similarApp)
  .route('/', batchApp);

workApp.get('/:id', async c => {
  const { id } = c.req.param();

  try {
    const work = await prisma.work.findUnique({
      where: { id },
      include: {
        circle: true,
        series: true,
        artists: true,
        illustrators: true,
        genres: true,
        translationInfo: true
      }
    });

    if (!work)
      return c.json({ message: '收藏不存在' }, 404);

    return c.json(work);
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

workApp.get('/subtitles/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await workIsExistsInDB(id))
      return c.json({ message: '收藏不存在' }, 404);

    const work = await prisma.work.findUnique({
      where: { id },
      select: { subtitles: true }
    });

    if (!work?.subtitles)
      return c.json({ message: '字幕不存在' }, 404);

    const filetype = await fileTypeFromBuffer(work.subtitles);

    return c.body(new Uint8Array(work.subtitles), 200, {
      'Content-Disposition': `attachment; filename=${filetype?.ext ? `${id}.${filetype.ext}` : 'unknown'}`
    });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

workApp.get('/exists/:id', async c => {
  const { id } = c.req.param();

  try {
    const exists = await workIsExistsInDB(id);
    return c.json({ exists: !!exists });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
