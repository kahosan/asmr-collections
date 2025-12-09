import type { WebDAVClient } from '@asmr-collections/webdav';
import type { WebDAVStorageConfig } from '@asmr-collections/shared';

import type { AdapterFile, FileStat, StorageAdapter } from '~/types/storage/adapters';

import { createClient } from '@asmr-collections/webdav';
import { STORAGE_TYPES, withoutTrailingSlash } from '@asmr-collections/shared';

import { resolveSecurePath } from '../utils';

export class WebDAVStorageAdapter implements StorageAdapter {
  readonly id: number;
  readonly name: string;
  readonly type = STORAGE_TYPES.WEBDAV;

  private readonly client: WebDAVClient;
  private readonly config: WebDAVStorageConfig;

  constructor(_id: number, _name: string, _config: WebDAVStorageConfig) {
    this.id = _id;
    this.name = _name;
    this.config = _config;

    this.client = createClient(this.config.url, {
      username: this.config.username,
      password: this.config.password
    });
  }

  resolvePath(path?: string): string {
    if (!path || path === '/') return withoutTrailingSlash(this.config.path);
    return resolveSecurePath(this.config.path, path);
  }

  static readonly test = async (config: WebDAVStorageConfig): Promise<boolean> => {
    try {
      const client = createClient(config.url, {
        username: config.username,
        password: config.password
      });

      return await client.exists(config.path);
    } catch (e) {
      console.error(`WebDAV 存储检测连接失败 ${config.path}:`, e);
      return false;
    }
  };

  async test(): Promise<boolean> {
    try {
      return await this.client.exists(this.config.path);
    } catch (e) {
      console.error(`WebDAV 存储检测连接失败 ${this.config.path}:`, e);
      return false;
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      return await this.client.exists(this.resolvePath(path));
    } catch {
      return false;
    }
  }

  async readdir(path?: string): Promise<FileStat[]> {
    const entries = await this.client.getDirectoryContents(this.resolvePath(path));

    return entries.map(entry => ({
      name: entry.basename,
      type: entry.type
    }));
  }

  async file(path: string): Promise<AdapterFile> {
    const file = await this.client.stat(this.resolvePath(path));

    const stream = (begin?: number, end?: number): Promise<ReadableStream> => {
      if (typeof begin === 'number')
        return this.client.createReadableStream(this.resolvePath(path), { start: begin, end });

      return this.client.createReadableStream(this.resolvePath(path));
    };

    return {
      size: file.size,
      type: file.type,
      name: file.basename,
      path: this.resolvePath(path),
      lastModified: new Date(file.lastmod).getTime(),
      stream
    };
  }
}
