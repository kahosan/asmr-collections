import type Database from 'bun:sqlite';
import type { Context, ExecutionContext } from 'hono';
import type { Cache, CacheEntry, CachifiedOptions, GetFreshValue } from '@epic-web/cachified';

import cachified, { softPurge, totalTtl, verboseReporter } from '@epic-web/cachified';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- use cachified
import { LRUCache } from 'lru-cache';
import { bunSqliteCacheAdapter, createBunSqliteCacheTable } from 'cachified-adapter-sqlite/bun';

import { IS_WORKERS, SQLITE_DB_PATH } from './constant';

let databaseInstance: Database | null = null;

const TABLE_NAME = 'cachified_cache';

async function getDatabaseInstance() {
  if (!databaseInstance) {
    // cf workers do not support bun
    const module = 'bun:sqlite';
    const SQLITE_DB: typeof Database = await import(module).then(mod => mod.default);
    databaseInstance = new SQLITE_DB(SQLITE_DB_PATH, { create: true });
    databaseInstance.run('PRAGMA journal_mode = WAL;');
    createBunSqliteCacheTable(databaseInstance, TABLE_NAME);
  }
  return databaseInstance;
}

const sqliteCache = IS_WORKERS
  ? null
  // eslint-disable-next-line antfu/no-top-level-await -- only used in server env
  : await (async () => {
    try {
      const database = await getDatabaseInstance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cachified types
      return bunSqliteCacheAdapter<any>({ database, tableName: TABLE_NAME });
    } catch (e) {
      console.error('[Cache] Failed to initialize bun:sqlite cache adapter:', e);
      return null;
    }
  })();

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
        await sqliteCache?.set(key, value);
      } catch (error) {
        console.error('Failed to set cache in SQLite:', error);
      }
    },
    async get(key) {
      let entry: CacheEntry<T> | undefined | null = lru.get(key);
      if (entry) return entry;

      try {
        entry = await sqliteCache?.get(key);
        if (entry) {
          const ttl = totalTtl(entry.metadata);
          lru.set(key, entry, {
            ttl: ttl === Infinity ? undefined : ttl,
            start: entry.metadata.createdTime
          });
        }

        return entry;
      } catch (error) {
        console.error('Failed to get cache from SQLite:', error);
        return null;
      }
    },
    async delete(key) {
      lru.delete(key);
      try {
        await sqliteCache?.delete(key);
      } catch (error) {
        console.error('Failed to delete cache from SQLite:', error);
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
