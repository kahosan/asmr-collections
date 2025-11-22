/* eslint-disable @typescript-eslint/no-loop-func -- batch */
/* eslint-disable no-await-in-loop -- batch */
import type { BatchResult, BatchSSEEvent, BatchSSEEvents } from '~/types/batch';
import type { WorkInfo } from '~/types/source';
import { newQueue } from '@henrygd/queue/rl';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getPrisma } from '~/lib/db';
import { fetchWorkInfo } from '~/lib/dlsite';
import { HTTPError } from '~/lib/fetcher';
import { generateEmbedding, saveCoverImage } from '~/router/utils';
import { createWork } from './create';
import { updateWork } from './update';

const createQueue = newQueue(10);
const refreshQueue = newQueue(10);
const fetchQueue = newQueue(10, 5, 1000); // 每秒最多 5 个请求

// 全局状态锁，防止多次触发
let isBatchRunning = false;

// 每一批处理的大小
const BATCH_SIZE = 50;

export const batchApp = new Hono();

let targetIds: string[] = [];
batchApp.on(['GET', 'POST'], '/batch/create', async c => {
  if (c.req.header('Content-Type') === 'application/json') {
    const { ids } = await c.req.json<{ ids: string[] }>();
    targetIds = ids;
    return c.json({ targetIds });
  }

  return streamSSE(c, async stream => {
    const sendEvent = async <K extends BatchSSEEvent>(
      event: K,
      data: BatchSSEEvents[K]
    ) => {
      // 如果客户端已断开，不再写入，防止后端报错
      if (c.req.raw.signal.aborted) {
        fetchQueue.clear();
        createQueue.clear();
        targetIds = [];
        return;
      };
      try {
        await stream.writeSSE({
          event,
          data: JSON.stringify(data)
        });
      } catch (e) {
        console.warn('SSE write failed (client disconnected?):', e);
      }
    };

    if (!targetIds.length) {
      sendEvent('log', { type: 'error', message: '未提供任何 ID，结束操作' });
      return sendEvent('end', { message: '请提供 ID' });
    }

    if (isBatchRunning) {
      await sendEvent('log', { type: 'error', message: '已有批量任务正在进行中，请稍后再试' });
      return sendEvent('error', {
        message: '正在进行操作，请稍后再试',
        details: '服务器正在处理另一个批量操作'
      });
    }

    isBatchRunning = true;
    const prisma = getPrisma();

    const result: BatchResult = { success: [], failed: [] };

    try {
      // 准备工作
      const totalWorks = targetIds.length;
      let currentStep = 0;
      const totalSteps = totalWorks * 2; // 每个作品两个步骤：获取信息 + 更新入库

      const sendProgress = async (id: string, status: 'success' | 'failed' | 'processing', msg?: string) => {
        const percent = Math.round((currentStep / totalSteps) * 100);
        await sendEvent('progress', {
          id,
          status,
          message: msg,
          current: currentStep,
          total: totalSteps,
          percent: percent > 100 ? 100 : percent
        });
      };

      await sendEvent('start', {
        total: totalSteps,
        message: `开始处理 ${totalWorks} 个作品，分批进行`
      });
      await sendEvent('log', {
        type: 'info',
        message: `准备完成，共 ${totalWorks} 个作品，将分为 ${Math.ceil(totalWorks / BATCH_SIZE)} 批处理`
      });

      const ensureRelationsEvent = () => sendEvent('log', { type: 'warning', message: '批次关联数据部分失败，但这不影响创建操作' });

      for (let i = 0; i < totalWorks; i += BATCH_SIZE) {
        if (c.req.raw.signal.aborted) {
          console.warn('客户端已断开，停止批量操作');
          break;
        }

        const batchIds = targetIds.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

        await sendEvent('log', {
          type: 'info',
          message: `开始处理第 ${batchIndex} 批，包含 ${batchIds.length} 个作品`
        });

        const existingWorks = await prisma.work.findMany({
          where: { id: { in: batchIds } },
          select: { id: true }
        });
        const existingIdSet = new Set(existingWorks.map(w => w.id));

        // 分离出“需要抓取”的 ID 列表
        const idsToFetch: string[] = [];

        // 先处理已存在的（直接跳过，不占用队列资源）
        for (const id of batchIds) {
          if (existingIdSet.has(id)) {
            result.failed.push({ id, error: '作品已收藏' });
            currentStep += 2; // 跳过两个步骤（抓取+创建），进度条直接补齐
            // 这里不需要 await，为了让前端快速刷屏，或者你可以加上 await 保证顺序
            await sendEvent('log', { type: 'warning', message: `作品 ${id} 已收藏，跳过` });
            await sendProgress(id, 'failed', `作品 ${id} 已收藏`);
          } else {
            idsToFetch.push(id);
          }
        }

        // 如果本批次所有 ID 都已存在，直接进入下一批
        if (idsToFetch.length === 0) continue;

        await sendEvent('log', {
          type: 'info',
          message: `本批次需抓取 ${idsToFetch.length} 个新作品，${batchIds.length - idsToFetch.length} 个已跳过`
        });

        const validData: Array<{ id: string, data: WorkInfo }> = [];

        const fetchTasks = batchIds.map(id => async () => {
          if (c.req.raw.signal.aborted)
            return;

          try {
            const data = await fetchWorkInfo(id);
            if (!data) {
              result.failed.push({ id, error: 'DLsite 不存在此作品' });
              // 失败意味着后续更新步骤也不会有了，所以进度 +2 (跳过更新阶段)
              currentStep += 2;
              await sendEvent('log', { type: 'warning', message: `DLsite 不存在 ${id}，跳过更新` });
              return await sendProgress(id, 'failed', `DLsite 不存在 ${id}`);
            }

            validData.push({ id, data });
            currentStep += 1; // 完成第一阶段
            await sendEvent('log', { type: 'info', message: `${id} 信息获取成功` });
            await sendProgress(id, 'processing', `${id} 信息获取成功`); // 此时状态还是 processing，因为还没入库
          } catch (e) {
            console.error(`获取 ${id} 信息失败：`, e);
            result.failed.push({ id, error: '网络或解析错误' });
            currentStep += 2;
            await sendEvent('log', { type: 'error', message: `获取 ${id} 信息失败` });
            await sendProgress(id, 'failed', `${id} 获取信息失败`);
          }
        });

        // 并发获取所有数据
        try {
          await fetchQueue.all(fetchTasks);
        } catch (e) {
          await sendEvent('log', { type: 'error', message: `信息获取队列出错：${e instanceof Error ? e.message : '未知错误'}` });
          console.error('信息获取队列出错:', e);
        }

        // 如果这一批没有有效数据，直接进入下一批
        if (validData.length === 0 && result.failed.length > 0) {
          await sendEvent('log', {
            type: 'info',
            message: '本批次无有效数据，跳过'
          });
          continue;
        };

        await sendEvent('log', {
          type: 'info',
          message: `信息获取阶段完成：成功 ${validData.length} 个，失败 ${result.failed.length} 个，开始更新入库阶段`
        });

        await ensureRelations(validData, ensureRelationsEvent);

        const createTasks = validData.map(({ id, data }) => async () => {
          if (c.req.raw.signal.aborted)
            return;

          let embedding: number[] | undefined;
          try {
            embedding = await generateEmbedding(data);
            await sendEvent('log', { type: 'info', message: `${id} 生成向量成功` });
            await sendProgress(id, 'processing', `${id} 生成向量成功`);
          } catch (e) {
            const message = (e instanceof HTTPError || e instanceof Error) ? e.message : '未知错误';
            console.error(`${id} 生成向量失败:`, message);
            await sendEvent('log', { type: 'warning', message: `${id} 生成向量失败` });
            await sendProgress(id, 'failed', `${id} 生成向量失败`);
          }

          try {
            const coverPath = await saveCoverImage(data.image_main, id);
            if (coverPath !== data.image_main) {
              await sendEvent('log', { type: 'info', message: `${id} 封面保存成功` });
              await sendProgress(id, 'processing', `${id} 封面保存成功`);
            }
            data.image_main = coverPath ?? data.image_main;
          } catch (e) {
            console.error('保存 cover 图片失败:', e);
            await sendEvent('log', { type: 'warning', message: `${id} 封面保存失败` });
            await sendProgress(id, 'failed', `${id} 封面保存失败`);
          }

          try {
            await createWork(data, id);
            if (embedding) {
              const vectorString = `[${embedding.join(',')}]`;
              await prisma.$executeRaw`UPDATE "Work" SET embedding = ${vectorString}::vector WHERE id = ${id}`;
            }

            result.success.push(id);
            currentStep += 1; // 完成第二阶段
            await sendEvent('log', { type: 'info', message: `${id} 创建成功` });
            await sendProgress(id, 'success', `${id} 创建成功`);
          } catch (e) {
            console.error(`创建 ${id} 失败:`, e);
            result.failed.push({ id, error: e instanceof Error ? e.message : '未知错误' });
            currentStep += 1;
            await sendEvent('log', { type: 'error', message: `${id} 创建失败` });
            await sendProgress(id, 'failed', `${id} 数据库操作失败`);
          }
        });

        try {
          await createQueue.all(createTasks);
        } catch (e) {
          console.error(e);
        }

        await sendEvent('log', {
          type: 'info',
          message: `第 ${batchIndex} 批：成功 ${result.success.length} 个，失败 ${result.failed.length} 个`
        });
      }

      await sendEvent('log', {
        type: 'info',
        message: `所有批次处理完成：成功: ${result.success.length}, 失败: ${result.failed.length}`
      });
      await sendEvent('end', {
        message: '批量创建完成',
        stats: result
      });
    } catch (e) {
      console.error('批量创建失败:', e);
      await sendEvent('log', {
        type: 'error',
        message: `批量创建失败: ${e instanceof Error ? e.message : '未知错误'}`
      });
      await sendEvent('error', {
        message: '批量创建失败',
        details: e instanceof Error ? e.message : '未知错误'
      });
    } finally {
      isBatchRunning = false;
      fetchQueue.clear();
      createQueue.clear();
      targetIds = [];
    }
  });
});

batchApp.get('/batch/refresh', c => {
  return streamSSE(c, async stream => {
    const sendEvent = async <K extends BatchSSEEvent>(
      event: K,
      data: BatchSSEEvents[K]
    ) => {
      // 如果客户端已断开，不再写入，防止后端报错
      if (c.req.raw.signal.aborted) {
        fetchQueue.clear();
        refreshQueue.clear();
        return;
      };
      try {
        await stream.writeSSE({
          event,
          data: JSON.stringify(data)
        });
      } catch (e) {
        console.warn('SSE write failed (client disconnected?):', e);
      }
    };

    if (isBatchRunning) {
      await sendEvent('log', { type: 'error', message: '已有批量任务正在进行中，请稍后再试' });
      return sendEvent('error', {
        message: '正在进行操作，请稍后再试',
        details: '服务器正在处理另一个批量操作'
      });
    }

    isBatchRunning = true;
    const prisma = getPrisma();

    const result: BatchResult = { success: [], failed: [] };

    try {
      // 准备工作
      const targetIds = await prisma.work.findMany({
        select: { id: true },
        orderBy: { updatedAt: 'asc' }
      })
        .then(works => works.map(w => w.id));

      const totalWorks = targetIds.length;
      let currentStep = 0;
      const totalSteps = totalWorks * 2; // 每个作品两个步骤：获取信息 + 更新入库

      const sendProgress = async (id: string, status: 'success' | 'failed' | 'processing', msg?: string) => {
        const percent = Math.round((currentStep / totalSteps) * 100);
        await sendEvent('progress', {
          id,
          status,
          message: msg,
          current: currentStep,
          total: totalSteps,
          percent: percent > 100 ? 100 : percent
        });
      };

      await sendEvent('start', {
        total: totalSteps,
        message: `开始处理 ${totalWorks} 个作品，分批进行`
      });
      await sendEvent('log', {
        type: 'info',
        message: `准备完成，共 ${totalWorks} 个作品，将分为 ${Math.ceil(totalWorks / BATCH_SIZE)} 批处理`
      });

      if (totalWorks === 0) {
        await sendEvent('log', { type: 'info', message: '没有需要更新的作品，结束操作' });
        isBatchRunning = false;
        return await sendEvent('end', { message: '没有需要更新的作品' });
      }

      const ensureRelationsEvent = () => sendEvent('log', { type: 'warning', message: '批次关联数据部分失败，但这不影响创建操作' });

      for (let i = 0; i < totalWorks; i += BATCH_SIZE) {
        if (c.req.raw.signal.aborted) {
          console.warn('客户端已断开，停止批量操作');
          break;
        }

        const batchIds = targetIds.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

        await sendEvent('log', {
          type: 'info',
          message: `开始处理第 ${batchIndex} 批，包含 ${batchIds.length} 个作品`
        });

        const validData: Array<{ id: string, data: WorkInfo }> = [];

        const fetchTasks = batchIds.map(id => async () => {
          if (c.req.raw.signal.aborted)
            return;

          try {
            const data = await fetchWorkInfo(id);
            if (!data) {
              result.failed.push({ id, error: 'DLsite 不存在此作品' });
              // 失败意味着后续更新步骤也不会有了，所以进度 +2 (跳过更新阶段)
              currentStep += 2;
              await sendEvent('log', { type: 'warning', message: `DLsite 不存在 ${id}，跳过更新` });
              return await sendProgress(id, 'failed', `DLsite 不存在 ${id}`);
            }

            validData.push({ id, data });
            currentStep += 1; // 完成第一阶段
            await sendEvent('log', { type: 'info', message: `${id} 信息获取成功` });
            await sendProgress(id, 'processing', `${id} 信息获取成功`); // 此时状态还是 processing，因为还没入库
          } catch (e) {
            console.error(`获取 ${id} 信息失败：`, e);
            result.failed.push({ id, error: '网络或解析错误' });
            currentStep += 2;
            await sendEvent('log', { type: 'error', message: `获取 ${id} 信息失败` });
            await sendProgress(id, 'failed', `${id} 获取信息失败`);
          }
        });

        // 并发获取所有数据
        try {
          await fetchQueue.all(fetchTasks);
        } catch (e) {
          await sendEvent('log', { type: 'error', message: `信息获取队列出错：${e instanceof Error ? e.message : '未知错误'}` });
          console.error('信息获取队列出错:', e);
        }

        // 如果这一批没有有效数据，直接进入下一批
        if (validData.length === 0 && result.failed.length > 0) {
          await sendEvent('log', {
            type: 'info',
            message: '本批次无有效数据，跳过'
          });
          continue;
        }

        await sendEvent('log', {
          type: 'info',
          message: `信息获取阶段完成：成功 ${validData.length} 个，失败 ${result.failed.length} 个，开始更新入库阶段`
        });

        await ensureRelations(validData, ensureRelationsEvent);

        const updateTasks = validData.map(({ id, data }) => async () => {
          if (c.req.raw.signal.aborted)
            return;

          try {
            const coverPath = await saveCoverImage(data.image_main, id);
            if (coverPath !== data.image_main) {
              await sendEvent('log', { type: 'info', message: `${id} 封面保存成功` });
              await sendProgress(id, 'processing', `${id} 封面保存成功`);
            }
            data.image_main = coverPath ?? data.image_main;
          } catch (e) {
            console.error('保存 cover 图片失败:', e);
            await sendEvent('log', { type: 'warning', message: `${id} 封面保存失败` });
            await sendProgress(id, 'failed', `${id} 封面保存失败`);
          }

          try {
            await updateWork(data, id);
            result.success.push(id);
            currentStep += 1; // 完成第二阶段
            await sendEvent('log', { type: 'info', message: `${id} 更新成功` });
            await sendProgress(id, 'success', `${id} 更新成功`);
          } catch (e) {
            console.error(`更新 ${id} 失败:`, e);
            result.failed.push({ id, error: e instanceof Error ? e.message : '未知错误' });
            currentStep += 1;
            await sendEvent('log', { type: 'error', message: `${id} 更新失败` });
            await sendProgress(id, 'failed', `${id} 数据库操作失败`);
          }
        });

        try {
          await refreshQueue.all(updateTasks);
        } catch (e) {
          console.error(e);
        }

        await sendEvent('log', {
          type: 'info',
          message: `第 ${batchIndex} 批：成功 ${result.success.length} 个，失败 ${result.failed.length} 个`
        });
      }

      await sendEvent('log', {
        type: 'info',
        message: `所有批次处理完成：成功: ${result.success.length}, 失败: ${result.failed.length}`
      });
      await sendEvent('end', {
        message: '批量更新完成',
        stats: result
      });
    } catch (e) {
      console.error('批量更新失败:', e);
      await sendEvent('log', {
        type: 'error',
        message: `批量更新失败: ${e instanceof Error ? e.message : '未知错误'}`
      });
      await sendEvent('error', {
        message: '批量更新失败',
        details: e instanceof Error ? e.message : '未知错误'
      });
    } finally {
      isBatchRunning = false;
      fetchQueue.clear();
      refreshQueue.clear();
    }
  });
});

async function ensureRelations(validData: Array<{ data: WorkInfo }>, sendEvent: () => Promise<void>) {
  try {
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
      await sendEvent();
    }
  } catch (e) {
    console.error('批量创建关联数据失败：', e);
    await sendEvent();
  }
}
