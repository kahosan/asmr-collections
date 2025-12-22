import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';

import { extname, HTTPError, WORK_ID_REGEX } from '@asmr-collections/shared';

import type { Tracks } from '@asmr-collections/shared';

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
    return toast.error(text, {
      ...options,
      id,
      description: options?.description ?? `${error.message}${error.data?.detail ? `：${error.data.detail}` : ''}`
    });
  }

  return toast.error(text, {
    ...options,
    id,
    description: error instanceof Error ? error.message : undefined
  });
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
    const ext = extname(item?.title ?? '').toLowerCase();
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

export function parseWorkInput(input: string) {
  const stats = {
    isEmpty: input.trim().length === 0,
    isValid: false,
    validIds: [] as string[]
  };

  if (!input) return stats;

  const matches = input.match(WORK_ID_REGEX);
  if (!matches) return stats;

  stats.validIds = Array.from(new Set(matches.map(id => id.toUpperCase())));
  stats.isValid = stats.validIds.length > 0;

  return stats;
}

export const externalUrl = {
  dlsite: (id: string) => `https://www.dlsite.com/maniax/work/=/product_id/${id}.html`,
  dlsiteKeyword: (text: string) => `https://www.dlsite.com/maniax/fsr/=/keyword_creater/"${text}"`,
  one: (id: string) => `https://asmr.one/work/${id}`
};

export function formatTimeAgoIntl(date: Date | string | number, lang = 'zh-CN'): string {
  const time = new Date(date).getTime();
  const now = Date.now();
  const diff = (time - now) / 1000; // 注意：Intl 需要负数表示过去

  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;

  // 取绝对值方便比较
  const absDiff = Math.abs(diff);

  if (absDiff < minute) return rtf.format(Math.round(diff), 'second'); // "几秒前" 或 "现在"
  if (absDiff < hour) return rtf.format(Math.round(diff / minute), 'minute');
  if (absDiff < day) return rtf.format(Math.round(diff / hour), 'hour');
  if (absDiff < month) return rtf.format(Math.round(diff / day), 'day');
  if (absDiff < year) return rtf.format(Math.round(diff / month), 'month');

  return rtf.format(Math.round(diff / year), 'year');
}
