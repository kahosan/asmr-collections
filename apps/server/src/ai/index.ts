import type { WorkInfo } from '~/types/source';
import type { AIProvider } from '~/types/ai/provider';

import type { WorkPassage } from './utils';

import { Jina } from './providers/jina';
import { formatPassage, normalizeWorkInfo } from './utils';

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
    const passage = formatPassage(normalizeWorkInfo(work));
    return this.#provider.vectorizePassage(passage);
  }

  rerank<T extends WorkPassage>(query: string, items: T[]) {
    const documents = items.map(formatPassage);
    return this.#provider.rerank(query, documents, items);
  }
}

export const ai = new AI();
