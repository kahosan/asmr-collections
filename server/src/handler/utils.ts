import type { PathLike } from 'node:fs';
import type { WorkInfo } from '~/types/source';

import * as fs from 'node:fs/promises';

import prisma from '~/lib/db';
import { fetcher, HTTPError } from '~/lib/fetcher';

export async function exists(path: PathLike): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

export function workIsExist(id: string) {
  return prisma.work.findUnique({ where: { id }, select: { id: true } });
}

export function formatError(e: unknown) {
  if (e instanceof HTTPError)
    return { message: e.message, data: e.data };

  if (e instanceof Error)
    return { message: e.message };

  return { message: e };
}

export function filterSubtitles<T>(data: T) {
  return (data as Array<{ subtitles?: unknown }>).map(work => ({
    ...work,
    subtitles: !!work.subtitles
  })) as T;
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
