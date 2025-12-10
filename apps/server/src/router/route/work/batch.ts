/* eslint-disable @typescript-eslint/no-loop-func -- batch */
/* eslint-disable no-await-in-loop -- batch */

import type { SSEStreamingApi } from 'hono/streaming';
import type { BatchResult, BatchSendEventFn, BatchSSEEvent, BatchSSEEvents } from '@asmr-collections/shared';

import type { WorkInfo } from '~/types/source';

import { randomUUID } from 'node:crypto';

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { newQueue } from '@henrygd/queue/rl';

import { storage } from '~/storage';
import { getPrisma } from '~/lib/db';
import { fetchWorkInfo } from '~/lib/dlsite';
import { generateEmbedding } from '~/ai/jina';
import { formatError, formatMessage, saveCoverImage } from '~/router/utils';

import { createWork } from './create';
import { updateWork } from './update';

const createQueue = newQueue(10);
const updateQueue = newQueue(10);
const fetchQueue = newQueue(10, 5, 1000); // 每秒最多 5 个请求

// 全局状态锁，防止多次触发
let isBatchRunning = false;

// 每一批处理的大小
const BATCH_SIZE = 50;

export const batchApp = new Hono();

let targetIds: string[] = [];
batchApp.on(['GET', 'POST'], '/batch/create', async c => {
  if (c.req.header('Content-Type') === 'application/json') {
    try {
      if (isBatchRunning)
        return c.json(formatMessage('已有批量任务正在进行中，请稍后再试'), 400);

      const { ids, sync } = await c.req.json<{ ids: string[], sync: boolean }>();

      targetIds = ids;
      // 如果是同步本地音声库，则使用获取到的所有本地库 id
      if (sync) targetIds = await storage.list();

      return c.json({ targetIds });
    } catch (e) {
      return c.json(formatError(e), 500);
    }
  }

  c.req.raw.signal.addEventListener('abort', handleAbort);

  return streamSSE(c, async stream => {
    const sendEvent = createSendEvent(stream);

    if (!targetIds.length) {
      sendEvent('log', { type: 'error', message: '未提供任何 ID，结束操作' });
      return sendEvent('end', { message: '请提供 ID' });
    }

    if (isBatchRunning) {
      await sendEvent('log', { type: 'error', message: '已有批量任务正在进行中，请稍后再试' });
      return sendEvent('error', { message: '正在进行操作，请稍后再试', details: '服务器正在处理另一个批量操作' });
    }

    isBatchRunning = true;
    const prisma = getPrisma();

    const result: BatchResult = { success: [], failed: [] };

    try {
      const totalSteps = targetIds.length;
      let currentStep = 0;

      const sendProgress = async () => {
        const percent = Math.round((currentStep / totalSteps) * 100);
        await sendEvent('progress', {
          current: currentStep,
          total: totalSteps,
          percent: percent > 100 ? 100 : percent
        });
      };

      await sendEvent('start', { total: totalSteps, message: `开始处理 ${totalSteps} 个作品，分批进行` });
      await sendEvent('log', { type: 'info', message: `准备完成，共 ${totalSteps} 个作品，将分为 ${Math.ceil(totalSteps / BATCH_SIZE)} 批处理` });

      const existingWorks = await prisma.work.findMany({
        where: { id: { in: targetIds } },
        select: { id: true }
      });
      const existingIdSet = new Set(existingWorks.map(w => w.id));

      for (let i = 0; i < totalSteps; i += BATCH_SIZE) {
        if (c.req.raw.signal.aborted) break;

        const batchIds = targetIds.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

        await sendEvent('log', {
          type: 'info',
          message: `开始处理第 ${batchIndex} 批，包含 ${batchIds.length} 个作品`
        });

        // 分离出“需要抓取”的 ID 列表
        const idsToFetch: string[] = [];

        // 先处理已存在的（直接跳过，不占用队列资源）
        for (const id of batchIds) {
          if (existingIdSet.has(id)) {
            result.failed.push({ id, error: '作品已收藏' });

            currentStep += 1;
            await sendProgress();
            await sendEvent('log', { type: 'warning', message: `作品 ${id} 已收藏，跳过` });
          } else {
            idsToFetch.push(id);
          }
        }

        // 如果本批次所有 ID 都已存在，直接进入下一批
        if (idsToFetch.length === 0) continue;

        await sendEvent('log', { type: 'info', message: `本批次需抓取 ${idsToFetch.length} 个新作品，${batchIds.length - idsToFetch.length} 个已跳过` });

        const { validData, failed } = await fetchValidData(
          idsToFetch,
          c.req.raw.signal,
          sendEvent,
          sendProgress,
          () => { currentStep += 1; }
        );

        result.failed.push(...failed);

        // 如果这一批没有有效数据，直接进入下一批
        if (validData.length === 0 && result.failed.length > 0) {
          await sendEvent('log', {
            type: 'info',
            message: '本批次无有效数据，跳过'
          });
          continue;
        };

        await sendEvent('log', { type: 'info', message: `信息获取阶段完成：成功 ${validData.length} 个，失败 ${result.failed.length} 个，开始更新入库阶段` });

        try {
          await ensureRelations(validData);
        } catch {
          return await sendEvent('log', { type: 'warning', message: '批次关联数据部分失败，请查看服务端日志' });
        }

        const createTasks = validData.map(({ id, data }) => async () => {
          if (c.req.raw.signal.aborted)
            return;

          let embedding: number[] | undefined;
          try {
            embedding = await generateEmbedding(data);
          } catch (e) {
            const message = (e instanceof Error) ? e.message : '未知错误';
            console.error(`${id} 生成向量失败:`, message);
            await sendEvent('log', { type: 'warning', message: `${id} 生成向量失败` });
          }

          try {
            const coverPath = await saveCoverImage(data.image_main, id);
            if (coverPath) data.image_main = coverPath;
          } catch (e) {
            console.error('保存 cover 图片失败：', e);
            await sendEvent('log', { type: 'warning', message: `${id} 封面保存失败` });
          }

          try {
            await createWork(data, id);
            if (embedding) {
              const vectorString = `[${embedding.join(',')}]`;
              await prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${id}`;
            }

            result.success.push(id);

            currentStep += 1;
            await sendProgress();
            await sendEvent('log', { type: 'info', message: `${id} 创建成功` });
          } catch (e) {
            console.error(`创建 ${id} 失败:`, e);
            result.failed.push({ id, error: e instanceof Error ? e.message : '未知错误' });

            currentStep += 1;
            await sendProgress();
            await sendEvent('log', { type: 'error', message: `${id} 创建失败` });
          }
        });

        try {
          await createQueue.all(createTasks);
        } catch (e) {
          console.error(e);
        }

        await sendEvent('log', { type: 'info', message: `第 ${batchIndex} 批：成功 ${result.success.length} 个，失败 ${result.failed.length} 个` });
      }

      await sendEvent('log', { type: 'info', message: `所有批次处理完成：成功: ${result.success.length}，失败：${result.failed.length}` });
      await sendEvent('end', { message: '批量创建完成', stats: result });
    } catch (e) {
      console.error('批量创建失败：', e);

      const message = e instanceof Error ? e.message : '未知错误';
      await sendEvent('log', { type: 'error', message: `批量创建失败：${message}` });
      await sendEvent('error', { message: '批量创建失败', details: message });
    } finally {
      isBatchRunning = false;
      targetIds = [];
      c.req.raw.signal.removeEventListener('abort', handleAbort);
    }
  });
});

batchApp.get('/batch/update', c => {
  c.req.raw.signal.addEventListener('abort', handleAbort);

  return streamSSE(c, async stream => {
    const sendEvent = createSendEvent(stream);

    if (isBatchRunning) {
      await sendEvent('log', { type: 'error', message: '已有批量任务正在进行中，请稍后再试' });
      return sendEvent('error', { message: '正在进行操作，请稍后再试', details: '服务器正在处理另一个批量操作' });
    }

    isBatchRunning = true;
    const prisma = getPrisma();

    const result: BatchResult = { success: [], failed: [] };

    try {
      const targetIds = await prisma.work.findMany({
        select: { id: true },
        orderBy: { updatedAt: 'asc' }
      })
        .then(works => works.map(w => w.id));

      const totalSteps = targetIds.length;
      let currentStep = 0;

      const sendProgress = async () => {
        const percent = Math.round((currentStep / totalSteps) * 100);
        await sendEvent('progress', {
          current: currentStep,
          total: totalSteps,
          percent: percent > 100 ? 100 : percent
        });
      };

      await sendEvent('start', { total: totalSteps, message: `开始处理 ${totalSteps} 个作品，分批进行` });
      await sendEvent('log', { type: 'info', message: `准备完成，共 ${totalSteps} 个作品，将分为 ${Math.ceil(totalSteps / BATCH_SIZE)} 批处理` });

      if (totalSteps === 0) {
        await sendEvent('log', { type: 'info', message: '没有需要更新的作品，结束操作' });
        return await sendEvent('end', { message: '没有需要更新的作品' });
      }

      for (let i = 0; i < totalSteps; i += BATCH_SIZE) {
        if (c.req.raw.signal.aborted) break;

        const batchIds = targetIds.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

        await sendEvent('log', { type: 'info', message: `开始处理第 ${batchIndex} 批，包含 ${batchIds.length} 个作品` });

        const { validData, failed } = await fetchValidData(
          batchIds,
          c.req.raw.signal,
          sendEvent,
          sendProgress,
          () => { currentStep += 1; }
        );

        result.failed.push(...failed);

        // 如果这一批没有有效数据，直接进入下一批
        if (validData.length === 0 && result.failed.length > 0) {
          await sendEvent('log', {
            type: 'info',
            message: '本批次无有效数据，跳过'
          });
          continue;
        }

        await sendEvent('log', { type: 'info', message: `信息获取阶段完成：成功 ${validData.length} 个，失败 ${result.failed.length} 个，开始更新入库阶段` });

        try {
          await ensureRelations(validData);
        } catch {
          return await sendEvent('log', { type: 'warning', message: '批次关联数据部分失败，请查看服务端日志' });
        }

        const updateTasks = validData.map(({ id, data }) => async () => {
          try {
            const coverPath = await saveCoverImage(data.image_main, id);
            if (coverPath) data.image_main = coverPath;
          } catch (e) {
            console.error('保存 cover 图片失败：', e);
            await sendEvent('log', { type: 'warning', message: `${id} 封面保存失败` });
          }

          try {
            await updateWork(data, id);
            result.success.push(id);

            currentStep += 1;
            await sendProgress();
            await sendEvent('log', { type: 'info', message: `${id} 更新成功` });
          } catch (e) {
            console.error(`更新 ${id} 失败:`, e);
            result.failed.push({ id, error: e instanceof Error ? e.message : '未知错误' });

            currentStep += 1;
            await sendProgress();
            await sendEvent('log', { type: 'error', message: `${id} 更新失败` });
          }
        });

        try {
          await updateQueue.all(updateTasks);
        } catch (e) {
          console.error(e);
        }

        await sendEvent('log', { type: 'info', message: `第 ${batchIndex} 批：成功 ${result.success.length} 个，失败 ${result.failed.length} 个` });
      }

      await sendEvent('log', { type: 'info', message: `所有批次处理完成：成功: ${result.success.length}, 失败: ${result.failed.length}` });
      await sendEvent('end', { message: '批量更新完成', stats: result });
    } catch (e) {
      console.error('批量更新失败：', e);

      const message = e instanceof Error ? e.message : '未知错误';
      await sendEvent('log', { type: 'error', message: `批量更新失败: ${message}` });
      await sendEvent('error', { message: '批量更新失败', details: message });
    } finally {
      isBatchRunning = false;
      c.req.raw.signal.removeEventListener('abort', handleAbort);
    }
  });
});

function handleAbort() {
  console.warn('客户端已断开，停止批量操作');
  fetchQueue.clear();
  updateQueue.clear();
  createQueue.clear();
};

function createSendEvent(stream: SSEStreamingApi): BatchSendEventFn {
  return async <K extends BatchSSEEvent>(
    event: K,
    data: BatchSSEEvents[K]
  ) => {
    try {
      await stream.writeSSE({
        id: randomUUID(),
        event,
        data: JSON.stringify(data)
      });
    } catch (e) {
      console.warn('SSE 写入数据失败 ：', e);
    }
  };
}

async function fetchValidData(
  ids: string[],
  abortSignal: AbortSignal,
  sendEvent: BatchSendEventFn,
  sendProgress: () => Promise<void>,
  changeCurrentStep: () => void
) {
  const validData: Array<{ id: string, data: WorkInfo }> = [];
  const failed: Array<{ id: string, error: string }> = [];

  const fetchTasks = ids.map(id => async () => {
    if (abortSignal.aborted) return;

    try {
      const data = await fetchWorkInfo(id);
      if (!data) {
        failed.push({ id, error: 'DLsite 不存在此作品' });

        changeCurrentStep();
        await sendProgress();
        return await sendEvent('log', { type: 'warning', message: `DLsite 不存在 ${id}，跳过更新` });
      }

      validData.push({ id, data });
      await sendEvent('log', { type: 'info', message: `${id} 信息获取成功` });
    } catch (e) {
      console.error(`获取 ${id} 信息失败：`, e);
      failed.push({ id, error: '网络或解析错误' });

      changeCurrentStep();
      await sendProgress();
      await sendEvent('log', { type: 'error', message: `获取 ${id} 信息失败` });
    }
  });

  // 并发获取所有数据
  try {
    await fetchQueue.all(fetchTasks);
  } catch (e) {
    await sendEvent('log', { type: 'error', message: `信息获取队列出错：${e instanceof Error ? e.message : '未知错误'}` });
    console.error('信息获取队列出错：', e);
  }

  return { validData, failed };
}

async function ensureRelations(validData: Array<{ data: WorkInfo }>) {
  const prisma = getPrisma();

  // 步骤 2: 提取所有需要的关联数据
  const circles = new Map<string, string>();
  const series = new Map<string, string>();
  const artists = new Map<string, string>();
  const illustrators = new Map<string, string>();
  const genres = new Map<number, string>();

  for (const { data } of validData) {
    circles.set(data.maker.id, data.maker.name);
    if (data.series?.id) series.set(data.series.id, data.series.name);
    data.artists?.forEach(name => artists.set(name, name));
    data.illustrators?.forEach(name => illustrators.set(name, name));
    data.genres?.forEach(g => genres.set(g.id, g.name));
  }

  // 步骤 3: 批量预创建可能缺失的关联数据
  const result = await Promise.allSettled([
    circles.size > 0 && prisma.circle.createMany({
      data: Array.from(circles, ([id, name]) => ({ id, name })),
      skipDuplicates: true
    }),
    series.size > 0 && prisma.series.createMany({
      data: Array.from(series, ([id, name]) => ({ id, name })),
      skipDuplicates: true
    }),
    artists.size > 0 && prisma.artist.createMany({
      data: Array.from(artists, ([name]) => ({ name })),
      skipDuplicates: true
    }),
    illustrators.size > 0 && prisma.illustrator.createMany({
      data: Array.from(illustrators, ([name]) => ({ name })),
      skipDuplicates: true
    }),
    genres.size > 0 && prisma.genre.createMany({
      data: Array.from(genres, ([id, name]) => ({ id, name })),
      skipDuplicates: true
    })
  ]);

  const rejected = result.filter(r => r.status === 'rejected');
  if (rejected.length > 0) {
    console.error('批量创建关联数据部分失败：', rejected.map(r => r.reason));
    throw new Error('批量创建关联数据失败');
  }
}
