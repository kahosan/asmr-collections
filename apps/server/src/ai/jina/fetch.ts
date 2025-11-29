import { fetcher } from '~/lib/fetcher';

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
