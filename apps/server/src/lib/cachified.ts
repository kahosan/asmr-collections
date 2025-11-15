import type { Cache, CacheEntry, CachifiedOptions, GetFreshValue } from '@epic-web/cachified';
import type { Context, ExecutionContext } from 'hono';
import cachified, { softPurge, totalTtl, verboseReporter } from '@epic-web/cachified';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- use cachified
import { LRUCache } from 'lru-cache';
import { IS_WORKERS } from './constant';

const DEFAULT_TTL = ttl(10);
const DEFAULT_MAX = 100;

interface CreateCachifiedOptions<T> extends Omit<CachifiedOptions<T>, 'cache' | 'key' | 'getFreshValue'> {
  lru?: {
    max?: number
  }
}

interface CachifiedParams<T> {
  cacheKey: string
  getFreshValue: GetFreshValue<T>
  ctx: Context
  ttl?: number
}

export function createCachified<T>(options?: CreateCachifiedOptions<T>) {
  const lru = new LRUCache<string, CacheEntry<T>>({
    max: options?.lru?.max ?? DEFAULT_MAX
  });

  const cache: Cache<T> = {
    set(key, value) {
      const ttl = totalTtl(value.metadata);
      return lru.set(key, value, {
        ttl: ttl === Infinity ? undefined : ttl,
        start: value.metadata.createdTime
      });
    },
    get(key) {
      return lru.get(key);
    },
    delete(key) {
      return lru.delete(key);
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

  const clearCache = async (cacheKey: string) => softPurge({ cache, key: cacheKey });

  return [cached, clearCache] as const;
}

/**
 * Convert minutes to milliseconds
 * @param minutes
 * @returns milliseconds
 * @example ttl(5) // 5 minutes in milliseconds
 */
export function ttl(minutes: number): number {
  return minutes * 60 * 1000;
};

export function getExecutionCtx(ctx: Context): ExecutionContext | undefined {
  return IS_WORKERS ? ctx.executionCtx : undefined;
}
