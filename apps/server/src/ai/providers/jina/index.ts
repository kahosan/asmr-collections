import { fetcher } from '~/lib/fetcher';
import { AIProvider } from '~/types/ai/provider';

const ENDPOINTS = {
  embeddings: 'https://api.jina.ai/v1/embeddings',
  rerank: 'https://api.jina.ai/v1/rerank'
} as const;

const MODELS = {
  embeddings: 'jina-embeddings-v4',
  rerank: 'jina-reranker-v3'
} as const;

type JinaOperation = keyof typeof ENDPOINTS;

interface JinaVectorizationResponse {
  data: Array<{ embedding: number[] }>
}

interface JinaRerankResponse {
  results: Array<{ index: number, relevance_score: number }>
}

interface JinaResponse {
  embeddings: JinaVectorizationResponse
  rerank: JinaRerankResponse
}

type VectorizationTask = 'retrieval.query' | 'retrieval.passage';

export class Jina extends AIProvider {
  readonly #dimensions: number;

  constructor(dimensions: number) {
    super();
    this.#dimensions = dimensions;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- This method is intentionally designed to be reusable for different operations
  #client<T extends JinaOperation>(operation: T, body: Record<string, unknown>) {
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) throw new Error('jina api key is missing');

    return fetcher<JinaResponse[T]>(ENDPOINTS[operation], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODELS[operation],
        ...body
      })
    });
  }

  async #vectorize(text: string, task: VectorizationTask) {
    const response = await this.#client('embeddings', {
      task,
      truncate: true,
      dimensions: this.#dimensions,
      input: [{ text }]
    });

    return response.data.at(0)?.embedding;
  }

  vectorizeQuery(query: string) {
    return this.#vectorize(query, 'retrieval.query');
  }

  vectorizePassage(passage: string) {
    return this.#vectorize(passage, 'retrieval.passage');
  }

  async rerank<T>(query: string, documents: string[], items: T[]) {
    try {
      const response = await this.#client('rerank', {
        query,
        documents,
        top_n: items.length
      });

      return response.results
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .map(r => items[r.index]);
    } catch (e) {
      console.warn('[Jina] rerank failed, falling back to vector order:', e);
      return items;
    }
  }
}
