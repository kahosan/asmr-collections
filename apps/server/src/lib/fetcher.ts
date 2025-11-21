import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class HTTPError extends Error {
  status: ContentfulStatusCode;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'HTTPError';
    this.status = status as ContentfulStatusCode;
    this.data = data;
  }
}

export async function fetcher<T>(url: string, options?: RequestInit) {
  const headers = new Headers();
  headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers))
      headers.set(key, value);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  try {
    const data = res.headers.get('content-type')?.includes('application/json')
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      if (stringData.includes('<!DOCTYPE html>'))
        throw new HTTPError(`请求 ${url} 失败，服务器发生错误：${res.status}`, res.status);

      throw new HTTPError(`请求 ${url} 失败`, res.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`解析 JSON 失败：${error.message}`);

    throw error;
  }
}
