import type { ErrorData } from '@asmr-collections/shared';

import { join } from 'node:path';

import { HTTPError } from '@asmr-collections/shared';
import { exists } from '@asmr-collections/shared/server';

import { getPrisma } from '~/lib/db';
import { COVERS_PATH, IS_WORKERS } from '~/lib/constant';

export function findwork(id: string) {
  const prisma = getPrisma();
  return prisma.work.findUnique({ where: { id }, select: { id: true } });
}

export function formatError(e: unknown, text?: string): { message: string, data?: ErrorData } {
  if (e instanceof HTTPError)
    return { message: text ?? e.message, data: e.data };

  if (e instanceof Error) {
    if (!text) return { message: e.message };

    return { message: text, data: { detail: e.message } };
  }

  if (typeof e === 'string')
    return { message: e };

  console.error('未知错误', e);
  return { message: '发生未知错误', data: { detail: '请查看服务端日志' } };
}

export function formatMessage(message: string, data?: unknown) {
  return { message, data };
}

export async function saveCoverImage(url: string, id: string) {
  if (IS_WORKERS) {
    console.warn('在 Workers 环境下无法保存封面图片');
    return;
  }

  const coverPath = join(COVERS_PATH, id + '.jpg');
  if (await exists(coverPath))
    return coverPath.replace(process.cwd(), '');

  const normalizedUrl = url.startsWith('//') ? 'https:' + url : url;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, 1000 * 10); // 10 秒超时

  try {
    const res = await fetch(normalizedUrl, {
      signal: controller.signal
    });

    if (!res.ok) {
      console.error(`下载封面图片失败：${res.status} ${res.statusText}`);
      throw new HTTPError(`下载封面图片失败：${res.statusText}`, res.status);
    }

    const buffer = await res.arrayBuffer();

    await Bun.write(coverPath, buffer);
    return coverPath.replace(process.cwd(), '');
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error('下载封面图片超时');

    throw error;
  } finally {
    clearTimeout(timer);
  }
}
