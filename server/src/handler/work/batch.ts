import type { WorkInfo } from '~/types/source';
import { newQueue } from '@henrygd/queue';
import { Hono } from 'hono';
import prisma from '~/lib/db';
import { fetchWorkInfo } from '~/lib/dlsite';
import { HTTPError } from '~/lib/fetcher';
import { generateEmbedding, workIsExistsInDB } from '../utils';
import { createWork } from './create';
import { updateWork } from './update';

const createQueue = newQueue(10);
const refreshQueue = newQueue(10);
const fetchQueue = newQueue(10);

export const batchApp = new Hono();

interface BatchResult {
  success: string[]
  failed: Array<{ id: string, error: string }>
}

batchApp.post('/batch/create', async c => {
  const { ids } = await c.req.json<{ ids: string[] }>();

  if (!ids.length)
    return c.json({ message: '请提供有效的 ID 列表' }, 400);

  const result: BatchResult = {
    success: [],
    failed: []
  };

  // 步骤 1: 并发收集所有需要处理的数据
  const validData: Array<{ id: string, data: WorkInfo }> = [];

  const fetchTasks = ids.map(id => async () => {
    try {
      if (await workIsExistsInDB(id)) {
        result.failed.push({ id, error: '作品已收藏' });
        return;
      }

      const data = await fetchWorkInfo(id);
      if (!data) {
        result.failed.push({ id, error: 'DLsite 不存在此作品' });
        return;
      }

      validData.push({ id, data });
    } catch (e) {
      console.error(`获取作品 ${id} 信息失败:`, e);
      result.failed.push({ id, error: '获取作品信息失败' });
    }
  });

  // 并发获取所有数据
  await fetchQueue.all(fetchTasks);

  if (validData.length === 0) {
    return c.json({
      ...result,
      message: '没有可添加的作品'
    });
  }

  // 步骤 2: 提取所有关联数据
  const circles = validData.map(({ data }) => ({
    id: data.maker.id,
    name: data.maker.name
  }));

  const series = validData.reduce<Array<{ id: string, name: string }>>((acc, { data }) => {
    if (data.series?.id)
      acc.push({ id: data.series.id, name: data.series.name });

    return acc;
  }, []);

  const genres = validData
    .flatMap(({ data }) => data.genres?.map(g => ({ id: g.id, name: g.name })) || []);

  const artists = validData
    .flatMap(({ data }) => data.artists?.map(name => ({ name })) || []);

  const illustrators = validData
    .flatMap(({ data }) => data.illustrators?.map(name => ({ name })) || []);

  // 步骤 3: 批量预创建所有关联数据（避免 connectOrCreate 的并发问题）
  try {
    // 创建 circles
    if (circles.length > 0) {
      await prisma.circle.createMany({
        data: circles,
        skipDuplicates: true
      });
    }

    // 创建 series
    if (series.length > 0) {
      await prisma.series.createMany({
        data: series,
        skipDuplicates: true
      });
    }

    // 创建 genres
    if (genres.length > 0) {
      await prisma.genre.createMany({
        data: genres,
        skipDuplicates: true
      });
    }

    // 创建 artists
    if (artists.length > 0) {
      await prisma.artist.createMany({
        data: artists,
        skipDuplicates: true
      });
    }

    // 创建 illustrators
    if (illustrators.length > 0) {
      await prisma.illustrator.createMany({
        data: illustrators,
        skipDuplicates: true
      });
    }
  } catch (e) {
    console.error('批量创建关联数据失败:', e);
    // 继续执行，因为可能只是部分数据已存在
  }

  // 步骤 4: 并发创建作品（使用 connect 而不是 connectOrCreate）
  const createTasks = validData.map(({ id, data }) => async () => {
    try {
      let embedding: number[] | undefined;
      try {
        embedding = await generateEmbedding(data);
      } catch (e) {
        const message = (e instanceof HTTPError || e instanceof Error) ? e.message : '未知错误';
        console.error(`${id} 生成向量失败:`, message);
        // 向量生成失败不影响作品创建
      }

      await createWork(data, id);

      if (embedding)
        await prisma.$executeRaw`UPDATE "Work" SET embedding = ${embedding}::vector WHERE id = ${id}`;

      result.success.push(id);
    } catch (e) {
      console.error(`创建作品 ${id} 失败:`, e);
      result.failed.push({
        id,
        error: e instanceof Error ? e.message : '未知错误'
      });
    }
  });

  await createQueue.all(createTasks);

  return c.json({
    ...result,
    message: '批量添加完成'
  });
});

batchApp.post('/batch/refresh', async c => {
  const targetIds = await prisma.work.findMany({ select: { id: true } })
    .then(works => works.map(w => w.id));

  if (targetIds.length === 0)
    return c.json({ message: '没有需要更新的作品' }, 400);

  const result: BatchResult = {
    success: [],
    failed: []
  };

  // 步骤 1: 并发收集所有需要更新的数据
  const validData: Array<{ id: string, data: WorkInfo }> = [];

  const fetchTasks = targetIds.map(id => async () => {
    try {
      const data = await fetchWorkInfo(id);
      if (!data) {
        result.failed.push({ id, error: 'DLsite 不存在此作品' });
        return;
      }
      validData.push({ id, data });
    } catch (e) {
      console.error(`获取作品 ${id} 信息失败:`, e);
      result.failed.push({ id, error: '获取作品信息失败' });
    }
  });

  // 并发获取所有数据
  await fetchQueue.all(fetchTasks);

  if (validData.length === 0) {
    return c.json({
      ...result,
      message: '没有可更新的作品'
    });
  }

  // 步骤 2: 提取所有需要的关联数据
  const circles = validData.map(({ data }) => ({
    id: data.maker.id,
    name: data.maker.name
  }));

  const series = validData.reduce<Array<{ id: string, name: string }>>((acc, { data }) => {
    if (data.series?.id)
      acc.push({ id: data.series.id, name: data.series.name });

    return acc;
  }, []);

  const artists = validData
    .flatMap(({ data }) => data.artists?.map(name => ({ name })) || []);

  const illustrators = validData
    .flatMap(({ data }) => data.illustrators?.map(name => ({ name })) || []);

  const genres = validData
    .flatMap(({ data }) => data.genres?.map(g => ({ id: g.id, name: g.name })) || []);

  // 步骤 3: 批量预创建可能缺失的关联数据
  try {
    // 创建 circles
    if (circles.length > 0) {
      await prisma.circle.createMany({
        data: circles,
        skipDuplicates: true
      });
    }

    // 创建 series
    if (series.length > 0) {
      await prisma.series.createMany({
        data: series,
        skipDuplicates: true
      });
    }

    if (artists.length > 0) {
      await prisma.artist.createMany({
        data: artists,
        skipDuplicates: true
      });
    }

    if (illustrators.length > 0) {
      await prisma.illustrator.createMany({
        data: illustrators,
        skipDuplicates: true
      });
    }

    if (genres.length > 0) {
      await prisma.genre.createMany({
        data: genres,
        skipDuplicates: true
      });
    }
  } catch (e) {
    console.error('批量创建关联数据失败:', e);
  }

  // 步骤 4: 并发更新作品
  const updateTasks = validData.map(({ id, data }) => async () => {
    try {
      await updateWork(data, id);
      result.success.push(id);
    } catch (e) {
      console.error(`更新作品 ${id} 失败:`, e);
      result.failed.push({
        id,
        error: e instanceof Error ? e.message : '未知错误'
      });
    }
  });

  await refreshQueue.all(updateTasks);

  return c.json({
    ...result,
    message: '批量更新完成'
  });
});

batchApp.post('/batch/cancel', async c => {
  const type = await c.req.text();

  if (type === 'create') {
    createQueue.clear();
    fetchQueue.clear();
    const active = createQueue.active();
    const fetching = fetchQueue.active();
    return c.json({ message: `已清理批量添加队列，正在进行的创建任务：${active}，正在获取数据：${fetching}` });
  }

  if (type === 'refresh') {
    refreshQueue.clear();
    fetchQueue.clear();
    const active = refreshQueue.active();
    const fetching = fetchQueue.active();
    return c.json({ message: `已清理批量更新队列，正在进行的更新任务：${active}，正在获取数据：${fetching}` });
  }

  if (type === 'all') {
    createQueue.clear();
    refreshQueue.clear();
    fetchQueue.clear();
    const createSize = createQueue.active();
    const refreshSize = refreshQueue.active();
    const fetchSize = fetchQueue.active();
    return c.json({ message: `已清理所有队列，正在进行的添加任务：${createSize}，更新任务：${refreshSize}，获取数据：${fetchSize}` });
  }

  return c.json({ message: '无效的操作类型' }, 400);
});
