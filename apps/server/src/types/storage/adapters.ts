import type { STORAGE_TYPES } from '@asmr-collections/shared';

type StorageType = typeof STORAGE_TYPES;

/**
 * 文件/目录的基础元数据
 */
export interface FileStat {
  name: string
  type: 'file' | 'directory'
}

export interface StorageAdapter {
  readonly id: number
  readonly name: string
  readonly type: StorageType[keyof StorageType]

  /**
   * 初始化/连接 (可选，视具体实现而定)
   */
  init?: () => Promise<void>

  /**
   * 测试存储连接是否可用
   */
  test: () => Promise<boolean>

  /**
   * 检查文件或目录是否存在
   */
  exists: (path: string) => Promise<boolean>

  /**
   * 读取目录内容
   * @param path 目录路径，默认为根目录
   */
  readdir: (path?: string) => Promise<FileStat[]>

  /**
   * 类似于 BunFile
   */
  file: (path: string) => Promise<AdapterFile>
}

export interface AdapterFile {
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
  stream(begin?: number, end?: number): ReadableStream
}
