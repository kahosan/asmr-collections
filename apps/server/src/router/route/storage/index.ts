import { Hono } from 'hono';
import { StorageConfigBodySchema, StorageParamSchema } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { zValidator } from '~/lib/validator';
import { storage as storageManager } from '~/storage';
import { formatError, formatMessage } from '~/router/utils';

export const storageApp = new Hono()
  .get('/', async c => {
    try {
      const prisma = getPrisma();
      const storages = await prisma.storage.findMany({ orderBy: { priority: 'desc' } });
      return c.json(storages);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  })
  .get('/:id', zValidator('param', StorageParamSchema), async c => {
    const { id } = c.req.valid('param');

    try {
      const prisma = getPrisma();
      const storage = await prisma.storage.findUnique({
        where: { id }
      });

      if (!storage)
        return c.json(formatMessage('存储不存在'), 404);

      return c.json(storage);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  })
  .post('/', zValidator('json', StorageConfigBodySchema), async c => {
    const body = c.req.valid('json');

    try {
      const ok = await storageManager.test(body.type, body.config);
      if (!ok) return c.json(formatMessage('存储配置验证失败，请检查配置项是否正确'), 400);

      const prisma = getPrisma();

      const storage = await prisma.storage.create({
        data: body
      });

      // 清除缓存
      storageManager.invalidateCache();

      return c.json(storage, 201);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  })
  .put('/:id', zValidator('param', StorageParamSchema), zValidator('json', StorageConfigBodySchema), async c => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    try {
      const ok = await storageManager.test(data.type, data.config);
      if (!ok) return c.json(formatMessage('存储配置验证失败，请检查配置项是否正确'), 400);

      const prisma = getPrisma();
      const storage = await prisma.storage.findUnique({
        where: { id }
      });

      if (!storage)
        return c.json(formatMessage('存储不存在'), 404);

      const updated = await prisma.storage.update({
        where: { id },
        data
      });

      storageManager.invalidateCache();

      return c.json(updated);
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  })
  .delete('/:id', zValidator('param', StorageParamSchema), async c => {
    const { id } = c.req.valid('param');

    try {
      const prisma = getPrisma();
      const storage = await prisma.storage.findUnique({
        where: { id }
      });

      if (!storage)
        return c.json(formatMessage('存储不存在'), 404);

      await prisma.storage.delete({
        where: { id }
      });

      storageManager.invalidateCache();

      return c.json(formatMessage(`${storage.name} 已删除`));
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  });
