/* eslint-disable sukka/react-prefer-destructuring-assignment -- not component */
import type { BunFile } from 'bun';

import type { AdapterFile } from '~/types/storage/adapters';

import * as p from 'node:path';
import * as pp from 'node:path/posix';

import { withoutLeadingSlash } from '@asmr-collections/shared';

/**
 * 解析路径，防止路径遍历攻击
 * @param base 基础路径
 * @param targetPath 目标路径
 * @param posix 是否使用 POSIX 模块
 * @returns 解析后的路径
 */
export function resolveSecurePath(base: string, targetPath: string, posix = false): string {
  const path = posix ? pp : p;

  const normalizedBase = path.resolve(base);

  const sanitized = withoutLeadingSlash(targetPath);

  const fullPath = path.resolve(normalizedBase, sanitized);

  const relativePath = path.relative(normalizedBase, fullPath);

  // Ensure the resolved path is within the base directory
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath))
    throw new Error(`Access denied: Path "${targetPath}" resolves outside base directory`);

  return fullPath;
}

/**
 * 将 BunFile 转换为本地 AdapterFile
 * @param file BunFile 对象
 * @param name 文件名
 * @param path 文件路径
 * @returns 本地 AdapterFile 对象
 */
export function BunFileToAdapterFile(file: BunFile, name: string, path: string): AdapterFile<'local'> {
  function chunk(begin = 0, end?: number): BunFile {
    if (begin === 0 && end === undefined)
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
    stream: (begin, end) => chunk(begin, end).stream()
  };
}
