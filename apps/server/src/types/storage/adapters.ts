import type { BunFile } from 'bun';
import type { StorageConfig, StorageType } from '@asmr-collections/shared';

export type StreamResult<T extends StorageType = StorageType> = T extends 'local'
  ? ReadableStream
  : Promise<ReadableStream>;

export type FileResult<T extends StorageType = StorageType> = T extends 'local'
  ? AdapterFile<'local'>
  : Promise<AdapterFile<T>>;

export type StorageAdapter<T extends StorageType = StorageType> = T extends unknown
  ? StorageAdapterBase<T>
  : never;

/**
 * 文件/目录的基础元数据
 */
export interface FileStat {
  name: string
  type: 'file' | 'directory'
}

export abstract class StorageAdapterBase<T extends StorageType = StorageType> {
  abstract readonly id: number;
  abstract readonly name: string;
  abstract readonly type: T;

  /**
   * 初始化/连接 (可选，视具体实现而定)
   */
  abstract init?: () => Promise<void> | void;

  /**
   * 解析路径，结合存储的根路径
   */
  abstract resolvePath(path: string): string;

  /**
   * 测试存储连接是否可用，创建实例前使用
   * @param config 存储配置
   */
  static readonly test: (config: StorageConfig) => Promise<boolean>;

  /**
   * 测试存储连接是否可用
   */
  abstract test: () => Promise<boolean>;

  /**
   * 检查文件或目录是否存在
   */
  abstract exists(path: string): Promise<boolean>;

  /**
   * 读取目录内容
   * @param path 目录路径，默认为根目录
   */
  abstract readdir(path?: string): Promise<FileStat[]>;

  /**
   * 类似于 BunFile
   */
  abstract file(path: string): FileResult<T>;
}

export type AdapterFile<T extends StorageType> = {
  /**
   * A UNIX timestamp indicating when the file was last modified.
   */
  lastModified: number

  /**
   * The size of this file in bytes
   */
  readonly size: number

  /**
   * The MIME type of the file
   */
  readonly type: string

  /**
   * The name of the file
   */
  readonly name: string

  /**
   * The path of the file
   * Return the full path from the storage root.
   */
  readonly path: string

  /**
   * Creates a readable stream for the file's data.
   * @param begin - start offset in bytes
   * @param end - absolute offset in bytes (relative to 0)
   */
  stream(begin?: number, end?: number): StreamResult<T>

  /**
   * 仅本地存储可用，返回 BunFile 对象
   */
  raw?: BunFile

  /**
   * 仅本地存储可用，返回指定范围的 BunFile 切片
   * @param begin - start offset in bytes
   * @param end - absolute offset in bytes (relative to 0)
   */
  chunk?: (begin: number, end?: number) => BunFile
} & (T extends 'local' ? { raw: BunFile, chunk: (begin: number, end?: number) => BunFile } : object);
