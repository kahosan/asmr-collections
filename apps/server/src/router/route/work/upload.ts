import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { findwork, formatError } from '~/router/utils';

export const uploadApp = new Hono()
  .put('/upload/subtitles/:id', async c => {
    const { id } = c.req.param();
    const { subtitles } = await c.req.parseBody<{ subtitles?: File }>();

    if (!subtitles || !(subtitles instanceof File))
      return c.json({ message: '文件格式不正确' }, 400);

    try {
      if (!await findwork(id))
        return c.json({ message: '收藏不存在' }, 400);

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
  });
