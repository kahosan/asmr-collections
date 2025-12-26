import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { formatError, formatMessage } from '~/router/utils';

import { infoApp } from './info';
import { batchApp } from './batch';
import { createApp } from './create';
import { deleteApp } from './delete';
import { randomApp } from './random';
import { updateApp } from './update';
import { similarApp } from './similar';

export const workApp = new Hono()
  .route('/', createApp)
  .route('/', deleteApp)
  .route('/', infoApp)
  .route('/', updateApp)
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
        translationInfo: true,
        playback: true
      }
    });

    if (!work)
      return c.json(formatMessage('收藏不存在'), 404);

    return c.json(work);
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
