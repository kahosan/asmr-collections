import type { PathLike } from 'node:fs';
import type { WorkInfo } from '~/types/source';

import * as fs from 'node:fs/promises';

import { HOST_URL, VOICE_LIBRARY } from '~/lib/constant';
import { getPrisma } from '~/lib/db';
import { fetcher, HTTPError } from '~/lib/fetcher';

export async function hasExistsInLocal(path: PathLike): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

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
