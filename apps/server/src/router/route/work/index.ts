import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { formatError, workIsExistsInDB } from '~/router/utils';

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

  const prisma = getPrisma();

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

    const prisma = getPrisma();

    const subtitlesData = await prisma.subtitlesData.findUnique({
      where: { workId: id },
      select: { data: true }
    });

    if (!subtitlesData?.data)
      return c.json({ message: '字幕不存在' }, 404);

    const data = new Uint8Array(subtitlesData.data);

    return c.body(data, 200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${id}.zip`,
      'Content-Length': data.length.toString()
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
