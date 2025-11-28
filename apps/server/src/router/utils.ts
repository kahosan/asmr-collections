import type { WorkInfo } from '~/types/source';

import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

import { exists, WORK_ID_EXACT_REGEX } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';
import { fetcher, HTTPError } from '~/lib/fetcher';
import { COVERS_PATH, HOST_URL, IS_WORKERS, VOICE_LIBRARY } from '~/lib/constant';

export function workIsExistsInDB(id: string) {
  const prisma = getPrisma();
  return prisma.work.findUnique({ where: { id }, select: { id: true } });
}

export function formatError(e: unknown, text?: string) {
  if (e instanceof HTTPError)
    return { message: text ?? e.message, data: e.data };

  if (e instanceof Error)
    return { message: text ? text + ': ' + e.message : e.message };

  if (typeof e === 'string')
    return { message: e };

  const error = e ? JSON.stringify(e).replaceAll(/^"|"$/g, '') : undefined;
  return { message: text ? (error ? text + ': ' + error : error) : error };
}

export async function generateEmbedding(d: WorkInfo | string) {
  const apiKey = process.env.JINA_API_KEY;
  const apiUrl = 'https://api.jina.ai/v1/embeddings';

  if (!apiKey) throw new Error('jina api key is missing');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };

  let embeddingText: string;
  let isQuery = false;

  if (typeof d === 'string') {
    embeddingText = d;
    isQuery = true;
  } else {
    const ageCategory = d.age_category === 1 ? '全年龄' : (d.age_category === 2 ? 'R15' : 'R18');

    const parts = [
      `作品名称: ${d.name}`,
      d.intro ? `作品简介: ${d.intro}` : '',
      `制作社团: ${d.maker.name}`,
      d.series?.name ? `所属系列: ${d.series.name}` : '',
      d.artists?.length ? `声优: ${d.artists.join('、')}` : '',
      d.illustrators?.length ? `画师: ${d.illustrators.join('、')}` : '',
      `年龄分级: ${ageCategory}`,
      d.genres?.length ? `标签: ${d.genres.map(g => g.name).join('、')}` : ''
    ];

    embeddingText = parts.join(' ');
  }

  const body = {
    model: 'jina-embeddings-v4',
    task: isQuery ? 'retrieval.query' : 'retrieval.passage',
    truncate: true,
    dimensions: 1024,
    input: [{ text: embeddingText }]
  };

  const data = await fetcher<{ data: Array<{ embedding: number[] }> } | null>(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  return data?.data.at(0)?.embedding;
}

/**
 * Get VOICE_LIBRARY and HOST_URL from environment variables, throw error if not configured
 * @returns VOICE_LIBRARY and HOST_URL
 */
export function getVoiceLibraryEnv() {
  if (!VOICE_LIBRARY || !HOST_URL)
    throw new Error('本地音声库或域名没有配置');

  return { VOICE_LIBRARY, HOST_URL };
};

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

export async function getAllLocalVoiceLibraryIds() {
  const { VOICE_LIBRARY } = getVoiceLibraryEnv();

  return readdir(VOICE_LIBRARY, { withFileTypes: true }).then(dir => {
    return dir.reduce<string[]>((ids, file) => {
      if (file.isDirectory() && WORK_ID_EXACT_REGEX.test(file.name))
        ids.push(file.name);
      return ids;
    }, []);
  });
}
