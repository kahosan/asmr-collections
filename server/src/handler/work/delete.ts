import { Hono } from 'hono';

import prisma from '~/lib/db';
import { formatError, workIsExist } from '../utils';

export const deleteApp = new Hono();

deleteApp.delete('/delete/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await workIsExist(id))
      return c.json({ message: '收藏不存在' }, 404);

    await prisma.work.delete({ where: { id } });
    return c.json({ message: '删除成功' });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
