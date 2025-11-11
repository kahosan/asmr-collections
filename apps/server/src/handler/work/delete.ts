import { Hono } from 'hono';

import { getPrisma } from '~/lib/db';
import { formatError, workIsExistsInDB } from '../utils';

export const deleteApp = new Hono();

deleteApp.delete('/delete/:id', async c => {
  const { id } = c.req.param();

  try {
    if (!await workIsExistsInDB(id))
      return c.json({ message: '收藏不存在' }, 404);

    const prisma = getPrisma();

    await prisma.work.delete({ where: { id } });
    return c.json({ message: '删除成功' });
  } catch (e) {
    return c.json(formatError(e), 500);
  }
});
