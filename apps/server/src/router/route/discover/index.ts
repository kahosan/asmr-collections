import { Hono } from 'hono';
import { DiscoveryRequestSchema, HTTPError } from '@asmr-collections/shared';

import { discover } from '~/discovery';
import { zValidator } from '~/lib/validator';
import { formatError } from '~/router/utils';

export const discoverApp = new Hono()
  .post('/', zValidator('json', DiscoveryRequestSchema), async c => {
    try {
      const request = c.req.valid('json');
      const data = await discover.generate(request);
      return c.json(data);
    } catch (error) {
      console.error(error);
      if (error instanceof HTTPError)
        return c.json(formatError(error), error.status);

      return c.json(formatError(error), 500);
    }
  });
