import { Hono } from 'hono';
import { PlaylistSearchQuerySchema, PlaylistUpsertSchema } from '@asmr-collections/shared';

import { prisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { formatError, formatMessage } from '~/router/utils';

export const playlistApp = new Hono()
  .get('/', zValidator('query', PlaylistSearchQuerySchema), async c => {
    const { page, limit } = c.req.valid('query');

    try {
      const [total, data] = await prisma.$transaction([
        prisma.playlist.count(),
        prisma.playlist.findMany({
          include: {
            works: {
              select: {
                work: {
                  select: {
                    id: true,
                    cover: true
                  }
                }
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' }
        })
      ]);

      const response = data.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        cover: playlist.cover ?? playlist.works.at(-1)?.work.cover,
        description: playlist.description,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        works: playlist.works.map(w => w.work)
      }));

      return c.json({ page, limit, total, data: response });
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .get('/:id', zValidator('query', PlaylistSearchQuerySchema), async c => {
    const { page, limit } = c.req.valid('query');
    const id = c.req.param('id');

    try {
      const playlist = await prisma.playlist.findUnique({
        where: { id },
        include: {
          _count: true,
          works: {
            include: {
              work: {
                include: {
                  circle: true,
                  series: true,
                  artists: true,
                  illustrators: true,
                  genres: true,
                  translationInfo: true
                }
              }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!playlist)
        return c.json(formatMessage('播放列表不存在'), 404);

      const total = playlist._count.works;

      const data = {
        id: playlist.id,
        name: playlist.name,
        cover: playlist.cover ?? playlist.works.at(-1)?.work.cover,
        description: playlist.description,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        works: playlist.works.map(w => w.work)
      };

      return c.json({ page, limit, total, data });
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .post('/', zValidator('json', PlaylistUpsertSchema), async c => {
    const { name, cover, description, works } = c.req.valid('json');

    try {
      const playlist = await prisma.playlist.create({
        data: { name, cover, description }
      });

      if (works.validIds.length > 0) {
        await prisma.playlistWork.createMany({
          data: works.validIds.map(workId => ({
            playlistId: playlist.id,
            workId
          })),
          skipDuplicates: true
        });
      }

      return c.json(playlist);
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .put('/:id', zValidator('json', PlaylistUpsertSchema), async c => {
    const id = c.req.param('id');
    const { name, cover, description, works } = c.req.valid('json');

    try {
      const playlist = await prisma.playlist.update({
        where: { id },
        data: { name, cover, description }
      });

      if (works.validIds.length > 0) {
        await prisma.playlistWork.createMany({
          data: works.validIds.map(workId => ({
            playlistId: playlist.id,
            workId
          })),
          skipDuplicates: true
        });
      }

      return c.json(playlist);
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .put('/:id/works/:workId', async c => {
    const { id, workId } = c.req.param();

    try {
      const playlistWork = await prisma.playlistWork.create({
        include: {
          playlist: {
            select: { cover: true }
          },
          work: {
            select: { cover: true }
          }
        },
        data: {
          playlistId: id,
          workId
        }
      });

      if (!playlistWork.playlist.cover) {
        await prisma.playlist.update({
          where: { id },
          data: { cover: playlistWork.work.cover }
        });
      }

      return c.json(playlistWork);
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'P2003')
        return c.json(formatError('关联的播放列表或作品不存在'), 404);

      if (e instanceof Error && 'code' in e && e.code === 'P2002')
        return c.json(formatError('该作品已在播放列表中'), 409);

      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .delete('/:id', async c => {
    const id = c.req.param('id');

    try {
      await prisma.playlist.delete({ where: { id } });

      return c.json(formatMessage('已删除播放列表'));
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .delete('/:id/works/:workId', async c => {
    const { id, workId } = c.req.param();

    try {
      await prisma.playlistWork.delete({
        where: {
          playlistId_workId: {
            playlistId: id,
            workId
          }
        }
      });

      return c.json(formatMessage('已从播放列表中移除'));
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  });
