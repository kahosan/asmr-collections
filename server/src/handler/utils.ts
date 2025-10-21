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

  if (typeof d === 'string') {
    embeddingText = d;
  } else {
    embeddingText = `
标题：${d.name}
简介：${d.intro}
社团：${d.maker.name}
系列：${d.series?.name ?? ''}
作者：${d.artists?.map(artist => artist).join(', ') ?? ''}
画师：${d.illustrators?.map(artist => artist).join(', ') ?? ''}
标签：${d.genres?.map(genre => genre.name).join(', ') ?? ''}
`;
  }

  const body = {
    model: 'jina-embeddings-v3',
    task: 'text-matching',
    input: [embeddingText]
  };

  const data = await fetcher<{ data: Array<{ embedding: number[] }> } | null>(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  return data?.data[0]?.embedding;
}
