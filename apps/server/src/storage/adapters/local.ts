import type { LocalStorageConfig } from '@asmr-collections/shared';

import type { AdapterFile, FileStat, StorageAdapter } from '~/types/storage/adapters';

import * as p from 'node:path';
import * as fs from 'node:fs/promises';

import { STORAGE_TYPES } from '@asmr-collections/shared';

import { resolveSecurePath } from '../utils';

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
    return resolveSecurePath(this.baseDir, path);
  }

  static readonly test = async (config: LocalStorageConfig): Promise<boolean> => {
    try {
      await fs.access(config.path, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch (e) {
      console.error(`本地存储检测连接失败 ${config.path}:`, e);
      return false;
    }
  };

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

  file(path: string): AdapterFile {
    const file = Bun.file(this.resolvePath(path));

    function stream(begin?: number, end?: number): ReadableStream {
      // 206 的 end 要 size - 1，但 slice 如果 -1 会丢失最后一个字节，所以这里 +1
      return file.slice(begin, end ? end + 1 : undefined).stream();
    }

    return {
      size: file.size,
      type: file.type,
      name: p.basename(path),
      path: this.resolvePath(path),
      lastModified: file.lastModified,
      stream
    };
  }
}
