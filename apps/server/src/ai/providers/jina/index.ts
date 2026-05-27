import { fetcher } from '~/lib/fetcher';
import { AIProvider } from '~/types/ai/provider';

export function fetchJina<T>(url: string, options?: RequestInit) {
  const apiKey = process.env.JINA_API_KEY;

  if (!apiKey) throw new Error('jina api key is missing');

  return fetcher<T>(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...options?.headers
    }
  });
};

interface JinaVectorizationResponse {
  data: Array<{
    embedding: number[]
  }>
}

type VectorizationTask = 'retrieval.query' | 'retrieval.passage';

export class Jina extends AIProvider {
  readonly #vectorizeEndpoint = 'https://api.jina.ai/v1/embeddings';
  readonly #model = 'jina-embeddings-v4';

  readonly #dimensions: number;

  constructor(dimensions: number) {
    super();
    this.#dimensions = dimensions;
  }

  async #vectorize(text: string, task: VectorizationTask) {
    const response = await fetchJina<JinaVectorizationResponse>(this.#vectorizeEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        model: this.#model,
        task,
        truncate: true,
        dimensions: this.#dimensions,
        input: [{ text }]
      })
    });

    return response.data.at(0)?.embedding;
  }

  vectorizeQuery(query: string) {
    return this.#vectorize(query, 'retrieval.query');
  }

  vectorizePassage(passage: string) {
    return this.#vectorize(passage, 'retrieval.passage');
  }
}
