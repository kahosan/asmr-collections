import type { ExternalToast } from 'sonner';
import { toast } from 'sonner';

import { HTTPError } from '~/lib/fetcher';

import type { Tracks } from '~/types/tracks';

export function writeClipboard(text: string, notifyText = '已复制到剪贴板') {
  if (typeof navigator.clipboard === 'undefined') {
    toast.error('复制失败', { description: '请检查是否处于 HTTPS 环境下，或浏览器不支持' });
  } else {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(notifyText))
      .catch(() => toast.error('复制失败', { description: '请检查是否处于 HTTPS 环境下，或浏览器不支持' }));
  }
}

export function notifyError(error: unknown, text: string, options?: ExternalToast) {
  let id: string | number = text;
  if (options?.id)
    id = options.id;

  if (error instanceof HTTPError) {
    let message = error.message;
    if (error.data) {
      message += ': ';
      message += typeof error.data === 'object' ? Object.values(error.data).join(', ') : error.data;
    }
    toast.error(text, {
      ...options,
      id,
      description: options?.description ?? message
    });
  }

  toast.error(text, {
    ...options,
    id,
    description: error instanceof Error ? error.message : undefined
  });
}

// 使用 >>> 0 处理无后缀情况：lastIndexOf 返回 -1 时转为超大正数
export function extractFileExt(name: string) {
  return name.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2);
}

function formatTimeUnit(unit: number) {
  return String(unit).padStart(2, '0');
}

export function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0)
    return `${formatTimeUnit(hrs)}:${formatTimeUnit(mins)}:${formatTimeUnit(secs)}`;

  return `${formatTimeUnit(mins)}:${formatTimeUnit(secs)}`;
}

/**
 * 查找包含目标文件类型的路径
 * @param tracks - 轨道数据
 * @param patterns - 文件扩展名模式数组（按优先级顺序）
 * @returns 找到的路径数组,如果未找到则返回 undefined
 */
export function findSmartPath(tracks: Tracks, patterns: string[]): string[] | undefined {
  // 按优先级顺序查找每个格式
  for (const pattern of patterns) {
    // 先排序 tracks，确保匹配 pattern 的文件夹或文件优先被处理
    const prioritizedTracks = tracks.sort((a, b) => {
      // 先比较是否匹配 pattern
      const aMatch = a.title.toLowerCase().includes(pattern) ? 0 : 1;
      const bMatch = b.title.toLowerCase().includes(pattern) ? 0 : 1;

      if (aMatch !== bMatch) return aMatch - bMatch;

      // 相同匹配情况下，按数字排序
      const aNum = Number.parseInt(a.title.replaceAll(/\D/g, ''), 10) || 0;
      const bNum = Number.parseInt(b.title.replaceAll(/\D/g, ''), 10) || 0;
      return aNum - bNum;
    });

    const result = searchInTracksForPattern(prioritizedTracks, pattern);
    if (result) return result;
  }

  function searchInTracksForPattern(items: Tracks, pattern: string, currentPath: string[] = []): string[] | undefined {
    const item = items.find(i => i.type === 'audio');
    const ext = extractFileExt(item?.title ?? '').toLowerCase();
    if (ext === pattern)
      return currentPath;

    for (const item of items.filter(i => i.type === 'folder')) {
      if (!item.children) continue;
      const result = searchInTracksForPattern(
        item.children,
        pattern,
        [...currentPath, item.title]
      );
      if (result) return result;
    }
  }
}
