import type { LocalStorageConfig } from '@asmr-collections/shared';

import type { AdapterFile, FileStat, StorageAdapter } from '~/types/storage/adapters';

import * as p from 'node:path';
import * as fs from 'node:fs/promises';

import { STORAGE_TYPES } from '@asmr-collections/shared';

export class LocalStorageAdapter implements StorageAdapter {
  readonly id: number;
  readonly name: string;
  readonly type = STORAGE_TYPES.LOCAL;
  readonly baseDir: string;

  constructor(_id: number, _name: string, config: LocalStorageConfig) {
    this.id = _id;
    this.name = _name;
    this.baseDir = config.path;
  }

  resolvePath(path: string): string {
    return p.resolve(this.baseDir, path);
  }

  async test(): Promise<boolean> {
    try {
      await fs.access(this.baseDir, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch (e) {
      console.error(`本地存储检测连接失败 ${this.baseDir}:`, e);
      return false;
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.stat(this.resolvePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async readdir(path?: string): Promise<FileStat[]> {
    const entries = await fs.readdir(this.resolvePath(path ?? ''), { withFileTypes: true });

    return entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file'
    }));
  }

  file(path: string): Promise<AdapterFile> {
    const file = Bun.file(this.resolvePath(path));

    function stream(begin?: number, end?: number): ReadableStream {
      return file.slice(begin, end).stream();
    }

    return Promise.resolve({
      size: file.size,
      type: file.type,
      name: p.basename(path),
      path: this.resolvePath(path),
      lastModified: file.lastModified,
      stream
    });
  }
}
