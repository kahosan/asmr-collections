import type { WorkInfo } from '~/types/source';
import type { AIProvider } from '~/types/ai/provider';

import { Jina } from './providers/jina';

class AI {
  readonly #provider: AIProvider;
  readonly #dimensions = 1024;

  constructor() {
    // TODO: 未来可能支持多个向量化服务提供商，甚至允许用户自定义配置
    this.#provider = new Jina(this.#dimensions);
  }

  vectorizeQuery(query: string) {
    return this.#provider.vectorizeQuery(query);
  }

  vectorizePassage(work: WorkInfo) {
    const ageCategory = work.age_category === 1 ? '全年龄' : (work.age_category === 2 ? 'R15' : 'R18');

    const parts = [
      work.genres?.length ? `标签: ${work.genres.map(g => g.name).join('、')}` : '',
      work.intro ? `作品简介: ${work.intro}` : '',
      `作品名称: ${work.name}`,
      work.series?.name ? `所属系列: ${work.series.name}` : '',
      `年龄分级: ${ageCategory}`,
      `制作社团: ${work.maker.name}`,
      work.artists?.length ? `声优: ${work.artists.join('、')}` : '',
      work.illustrators?.length ? `画师: ${work.illustrators.join('、')}` : ''
    ];

    const passage = parts.filter(Boolean).join(' ');
    return this.#provider.vectorizePassage(passage);
  }
}

export const ai = new AI();
