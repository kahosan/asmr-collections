/* eslint-disable no-await-in-loop -- sequential checks are intended */

import type { BunFile } from 'bun';
import type { StorageConfig, StorageType } from '@asmr-collections/shared';

import type { AdapterFile, FileResult, StorageAdapter } from '~/types/storage/adapters';

import { match } from 'ts-pattern';
import { LocalStorageConfigSchema, STORAGE_TYPES, WebDAVStorageConfigSchema, WORK_ID_EXACT_REGEX } from '@asmr-collections/shared';

import { getPrisma } from '~/lib/db';

import { LocalStorageAdapter } from './adapters/local';
import { WebDAVStorageAdapter } from './adapters/webdav';

export class StorageManager {
  private adaptersCache: StorageAdapter[] | null = null;

  async getAdapters(): Promise<StorageAdapter[]> {
    if (this.adaptersCache) return this.adaptersCache;

    const prisma = getPrisma();
    const storages = await prisma.storage.findMany({
      orderBy: { priority: 'desc' }
    });

    const adapters: StorageAdapter[] = [];

    for (const storage of storages) {
      const adapter = match(storage.type)
        .with(STORAGE_TYPES.LOCAL, () => {
          const config = LocalStorageConfigSchema.parse(storage.config);
          return new LocalStorageAdapter(storage.id, storage.name, config);
        })
        .with(STORAGE_TYPES.WEBDAV, () => {
          const config = WebDAVStorageConfigSchema.parse(storage.config);
          return new WebDAVStorageAdapter(storage.id, storage.name, config);
        })
        .otherwise(() => {
          throw new Error(`发现未知存储类型: ${storage.type}, ID: ${storage.id}`);
        });

      adapters.push(adapter);
    }

    this.adaptersCache = adapters;
    return adapters;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- ignore
  test(type: StorageType, config: StorageConfig): Promise<boolean> {
    return match(type)
      .with(STORAGE_TYPES.LOCAL, () => {
        const localConfig = LocalStorageConfigSchema.parse(config);
        return LocalStorageAdapter.test(localConfig);
      })
      .with(STORAGE_TYPES.WEBDAV, () => {
        const webdavConfig = WebDAVStorageConfigSchema.parse(config);
        return WebDAVStorageAdapter.test(webdavConfig);
      })
      .otherwise(() => {
        throw new Error(`发现未知存储类型: ${type}`);
      });
  };

  async find(path: string): Promise<StorageAdapter | undefined> {
    const adapters = await this.getAdapters();

    for (const adapter of adapters) {
      const isHealthy = await adapter.test();

      if (!isHealthy)
        throw new Error(`${adapter.name} 不可用，连接检测失败，请检查配置或网络`);

      if (await adapter.exists(path))
        return adapter;
    }
  }

  async exists(path: string): Promise<boolean> {
    const adapter = await this.find(path);
    return !!adapter;
  }

  async file(path: string): Promise<FileResult | undefined> {
    const adapter = await this.find(path);
    if (adapter) return adapter.file(path);
  }

  /**
   * 列出所有存储适配器中的根目录里的作品 ID 的并集
   * @returns 作品 ID 列表
   */
  async list(): Promise<string[]> {
    const adapters = await this.getAdapters();

    const set = new Set<string>();

    for (const adapter of adapters) {
      if (!(await adapter.test()))
        throw new Error(`${adapter.name} 不可用，无法获取库列表`);

      const items = await adapter.readdir();

      for (const item of items) {
        if (item.type === 'directory' && WORK_ID_EXACT_REGEX.test(item.name))
          set.add(item.name);
      }
    }

    return Array.from(set);
  }

  invalidateCache() {
    this.adaptersCache = null;
    console.log('Storage cache invalidated');
  }
}

export const storage = new StorageManager();

/**
 * 将 BunFile 转换为本地 AdapterFile
 * @param file BunFile 对象
 * @param name 文件名
 * @param path 文件路径
 * @returns 本地 AdapterFile 对象
 */
export function BunFileToAdapterFile(file: BunFile, name: string, path: string): AdapterFile<'local'> {
  function chunk(begin = 0, end?: number): BunFile {
    if (begin === 0 && typeof end === 'undefined')
      return file;

    // 206 的 end 要 size - 1，但 slice 如果 -1 会丢失最后一个字节，所以这里 +1
    const _end = typeof end === 'number' ? end + 1 : undefined;
    return file.slice(begin, _end);
  }

  return {
    size: file.size,
    type: file.type,
    name,
    path,
    lastModified: file.lastModified,
    raw: file,
    chunk,
    stream: (begin, end) => chunk(begin ?? 0, end).stream()
  };
}
