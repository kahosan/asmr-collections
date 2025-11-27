import { Hono } from 'hono';
import { proxy } from 'hono/proxy';

import { formatError } from './utils';

export const proxyApp = new Hono();

proxyApp.all('/:path', c => {
  const targetUrl = decodeURIComponent(c.req.param('path'));

  if (!URL.canParse(targetUrl))
    return c.json({ message: '无效的域名格式' }, 400);

  return proxy(targetUrl, {
    headers: {
      ...c.req.header(),
      host: undefined
    }
  })
    .catch(e => c.json(formatError(e), 500));
});
