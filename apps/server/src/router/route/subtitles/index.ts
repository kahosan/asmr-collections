import { z } from 'zod';
import { Hono } from 'hono';
import { readerZipFileSubtitles } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { findwork, formatError, formatMessage } from '~/router/utils';

const schema = z.object({
  action: z.enum(['download']).optional()
});

export const subtitlesApp = new Hono()
  .get('/:id', zValidator('query', schema), async c => {
    const { id } = c.req.param();
    const { action } = c.req.valid('query');

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

      const data = subtitlesData.data;

      if (action === 'download') {
        return c.body(data, 200, {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename=${id}.zip`,
          'Content-Length': data.length.toString()
        });
      }

      const subtitles = await readerZipFileSubtitles(data);

      return c.json(subtitles);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  })
  .put('/:id', async c => {
    const { id } = c.req.param();
    const { subtitles } = await c.req.parseBody<{ subtitles?: File }>();

    if (!subtitles || !(subtitles instanceof File))
      return c.json(formatMessage('文件格式不正确'), 400);

    try {
      if (!await findwork(id))
        return c.json(formatMessage('收藏不存在'), 404);

      const prisma = getPrisma();

      const newSubtitlesData = Buffer.from(await subtitles.arrayBuffer());

      await prisma.work.update({
        where: { id },
        data: {
          subtitles: true,
          subtitlesData: {
            upsert: {
              create: { data: newSubtitlesData },
              update: { data: newSubtitlesData }
            }
          }
        }
      });

      return c.json({ id });
    } catch (e) {
      console.error(e);
      return c.json(formatError(e), 500);
    }
  })
  .delete('/:id', async c => {
    const { id } = c.req.param();

    try {
      if (!await findwork(id))
        return c.json(formatMessage('收藏不存在'), 404);

      const prisma = getPrisma();

      await prisma.work.update({
        where: { id },
        data: {
          subtitles: false,
          subtitlesData: {
            delete: true
          }
        }
      });

      return c.body(null, 204);
    } catch (e) {
      // @ts-expect-error -- TODO: use prisma error type
      if (e?.code === 'P2025')
        return c.json(formatMessage('字幕不存在'), 404);

      return c.json(formatError(e), 500);
    }
  });
