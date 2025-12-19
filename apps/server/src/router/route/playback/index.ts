import type { Prisma } from '~/lib/prisma/client';

import { Hono } from 'hono';
import { PlaybackSearchQuerySchema, PlaybackUpsertSchema } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { formatError, formatMessage } from '~/router/utils';

const PLAYBACK_INCLUDE = {
  work: {
    select: {
      id: true,
      name: true,
      cover: true,
      artists: true,
      circle: true
    }
  }
};

export const playbackApp = new Hono()
  .get('/', zValidator('query', PlaybackSearchQuerySchema), async c => {
    const { page, limit } = c.req.valid('query');

    try {
      const prisma = getPrisma();

      const [total, data] = await Promise.all([
        prisma.playback.count(),
        prisma.playback.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { lastAt: 'desc' },
          include: PLAYBACK_INCLUDE
        })
      ]);

      const response = {
        page,
        limit,
        total,
        data
      };

      return c.json(response);
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .get('/:id', async c => {
    const id = c.req.param('id');

    try {
      const prisma = getPrisma();

      const playback = await prisma.playback.findUnique({
        where: { workId: id },
        include: PLAYBACK_INCLUDE
      });

      if (!playback)
        return c.json(formatMessage('播放记录不存在'), 404);

      return c.json(playback);
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .put('/:id', zValidator('json', PlaybackUpsertSchema), async c => {
    const id = c.req.param('id');
    const { track: _t, tracks: _ts, position, incrementCount } = c.req.valid('json');

    // eslint-disable-next-line sukka/type/no-force-cast-via-top-type -- 直接强制转换了，JSON 没有类型验证或者用这个库：https://github.com/arthurfiorette/prisma-json-types-generator
    const track = _t as unknown as Prisma.InputJsonValue;
    const tracks = _ts as unknown as Prisma.InputJsonValue[];

    try {
      const prisma = getPrisma();

      const playback = await prisma.playback.upsert({
        where: { workId: id },
        create: {
          workId: id,
          track,
          tracks,
          position,
          count: 1,
          lastAt: new Date()
        },
        update: {
          track,
          tracks,
          position,
          count: incrementCount ? { increment: 1 } : undefined,
          lastAt: new Date()
        }
      });

      return c.json(playback);
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'P2003')
        return c.json(formatMessage('关联的作品不存在'), 404);

      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .delete('/:id', async c => {
    const id = c.req.param('id');

    try {
      const prisma = getPrisma();

      await prisma.playback.delete({
        where: { workId: id }
      });

      return c.json(formatMessage('已删除播放记录'));
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  });
