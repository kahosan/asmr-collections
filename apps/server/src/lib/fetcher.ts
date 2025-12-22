import { match, P } from 'ts-pattern';
import { HTTPError } from '@asmr-collections/shared';

export async function fetcher<T>(url: string, options?: RequestInit) {
  const headers = new Headers();
  headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  if (options?.headers) {
    const optionsHeaders = new Headers(options.headers);
    optionsHeaders.forEach((value, key) => headers.set(key, value));
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  try {
    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      if (contentType?.includes('text/html'))
        console.error('请求返回 HTML', { url, status: res.status });
      else
        console.error('请求失败', { url, status: res.status, data });

      const message = '服务请求失败';

      // If the response is HTML, short-circuit before pattern matching on data
      if (contentType?.includes('text/html'))
        throw new HTTPError(message, res.status, { detail: '服务暂时不可用，返回了 HTML 页面' });

      match(data)
        .with({ detail: P.string }, d => {
          // jina error
          throw new HTTPError(message, res.status, d);
        })
        .with({ error: P.string }, d => {
          // asmr.one error
          throw new HTTPError(message, res.status, { detail: d.error });
        })
        .with(P.string, d => {
          throw new HTTPError(message, res.status, { detail: d });
        })
        .otherwise(() => {
          throw new HTTPError(message, res.status);
        });
    }

    return data as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('解析错误', error);
      throw new HTTPError('数据解析失败，请查看日志', res.status);
    }

    throw error;
  }
}
