import type { WorkInfo } from '~/types/source';

import { fetchJina } from './fetch';

export async function generateEmbedding(d: WorkInfo | string) {
  const apiUrl = 'https://api.jina.ai/v1/embeddings';

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

  const data = await fetchJina<{ data: Array<{ embedding: number[] }> } | null>(apiUrl, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return data?.data.at(0)?.embedding;
}
