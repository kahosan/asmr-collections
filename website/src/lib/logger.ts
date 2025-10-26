import { pino } from 'pino';

export const logger = pino({
  browser: {
    serialize: true,
    asObject: true
  }
});
