import type { Context, ExecutionContext } from 'hono';
import type { Cache, CacheEntry, CachifiedOptions, GetFreshValue } from '@epic-web/cachified';

import cachified, { softPurge, totalTtl, verboseReporter } from '@epic-web/cachified';

import { RedisClient } from 'bun';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- use cachified
import { LRUCache } from 'lru-cache';
import { redisCacheAdapter } from 'cachified-redis-adapter';

import { IS_WORKERS, REDIS_URL } from './constant';

const redisCache = REDIS_URL
  // eslint-disable-next-line antfu/no-top-level-await -- top-level await is allowed in this file
  ? await (async () => {
    try {
      const client = new RedisClient(REDIS_URL);
      await client.connect();

      return redisCacheAdapter(client);
    } catch (error) {
      console.error('Failed to create Redis client for cachified:', error);
      return null;
    }
  })()
  : null;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/**
 * Utility to generate TTL values.
 * @example
 * ```ts
 * const tenMinutes = ttl.minute(10);
 * const twoHours = ttl.hour(2);
 * const threeDays = ttl.day(3);
 * ```
 */
export const ttl = {
  minute: (min: number) => min * MINUTE_MS,
  hour: (hr: number) => hr * HOUR_MS,
  day: (d: number) => d * DAY_MS
};

const DEFAULT_TTL = ttl.minute(10);
const DEFAULT_MAX = 100;

interface CreateCachifiedOptions<T> extends Omit<CachifiedOptions<T>, 'cache' | 'key' | 'getFreshValue'> {
  lru?: {
    max?: number
  }
}

type CacheKey =
  | `tracks-${string}`
  | `asmrone-tracks-${string}-${string}`
  | `dlsite-work-info-${string}`
  | `asmrone-similar-work-${string}-${string}`
  | `similar-work-${string}`;

interface CachifiedParams<T> {
  cacheKey: CacheKey
  getFreshValue: GetFreshValue<T>
  ctx: Context
  ttl?: number
}

export function createCachified<T>(options?: CreateCachifiedOptions<T>) {
  const lru = new LRUCache<string, CacheEntry<T>>({
    max: options?.lru?.max ?? DEFAULT_MAX
  });

  const cache: Cache<T> = {
    async set(key, value) {
      const ttl = totalTtl(value.metadata);

      lru.set(key, value, {
        ttl: ttl === Infinity ? undefined : ttl,
        start: value.metadata.createdTime
      });

      try {
        await redisCache?.set(key, value);
      } catch (error) {
        console.error('Failed to set cache in Redis:', error);
      }
    },
    async get(key) {
      let entry: CacheEntry<T> | undefined | null = lru.get(key);
      if (entry) return entry;

      try {
        entry = await redisCache?.get(key);
        if (entry) {
          const ttl = totalTtl(entry.metadata);
          lru.set(key, entry, {
            ttl: ttl === Infinity ? undefined : ttl,
            start: entry.metadata.createdTime
          });
        }

        return entry;
      } catch (error) {
        console.error('Failed to get cache from Redis:', error);
        return null;
      }
    },
    async delete(key) {
      lru.delete(key);
      try {
        await redisCache?.delete(key);
      } catch (error) {
        console.error('Failed to delete cache from Redis:', error);
      }
    }
  };

  const cached = ({ cacheKey, ttl, ctx, getFreshValue }: CachifiedParams<T>) => {
    const executionCtx = getExecutionCtx(ctx);
    return cachified<T>({
      key: cacheKey,
      cache,
      getFreshValue,
      ...options,
      ttl: ttl ?? options?.ttl ?? DEFAULT_TTL,
      waitUntil: promise => executionCtx?.waitUntil(promise)
    }, verboseReporter());
  };

  const clearCache = (cacheKey: CacheKey, soft = true): unknown | Promise<unknown> => {
    if (soft)
      return softPurge({ cache, key: cacheKey });

    return cache.delete(cacheKey);
  };

  return [cached, clearCache] as const;
}

export function getExecutionCtx(ctx: Context): ExecutionContext | undefined {
  return IS_WORKERS ? ctx.executionCtx : undefined;
}
