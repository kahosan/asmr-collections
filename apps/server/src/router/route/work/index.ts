import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { findwork, formatError, formatMessage } from '~/router/utils';

import { infoApp } from './info';
import { batchApp } from './batch';
import { createApp } from './create';
import { deleteApp } from './delete';
import { randomApp } from './random';
import { updateApp } from './update';
import { uploadApp } from './upload';
import { similarApp } from './similar';

export const workApp = new Hono()
  .route('/', createApp)
  .route('/', deleteApp)
  .route('/', infoApp)
  .route('/', updateApp)
  .route('/', uploadApp)
  .route('/', similarApp)
  .route('/', batchApp)
  .route('/', randomApp);

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
      return c.json(formatMessage('收藏不存在'), 404);

    return c.json(work);
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});

workApp.get('/subtitles/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await findwork(id))
      return c.json(formatMessage('收藏不存在'), 404);

    const prisma = getPrisma();

    const subtitlesData = await prisma.subtitlesData.findUnique({
      where: { workId: id },
      select: { data: true }
    });

    if (!subtitlesData?.data)
      return c.json(formatMessage('字幕不存在'), 404);

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
