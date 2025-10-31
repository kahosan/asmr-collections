export class HTTPError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
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

    if (!res.ok)
      throw new HTTPError(`Fetch ${url} failed`, res.status, data);

    return data as T;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`Failed to parse JSON body: ${error.message}`);

    throw error;
  }
}
