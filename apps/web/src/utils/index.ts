import type { ExternalToast } from 'sonner';
import { toast } from 'sonner';

import type { Tracks } from '~/types/tracks';
import type { SubtitleInfo } from '~/hooks/use-media-state';

import { HTTPError } from '~/lib/fetcher';

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

/**
 * 收集字幕文件
 * @param data - 轨道数据
 * @param recursive - 是否递归收集子目录的字幕文件,默认为 false
 * @returns 字幕信息数组
 */
export function collectSubtitles(data: Tracks | undefined, recursive = false): SubtitleInfo[] {
  if (!data) return [];

  const subtitles: SubtitleInfo[] = [];
  const supportedExtensions = new Set(['srt', 'lrc', 'vtt']);

  function processItem(item: Tracks[number]) {
    if (item.type === 'text' && supportedExtensions.has(extractFileExt(item.title))) {
      const url = item.mediaDownloadUrl;
      if (url) {
        subtitles.push({
          title: item.title,
          url
        });
      }
    }
  }

  function traverse(items: Tracks) {
    for (const item of items) {
      processItem(item);
      if (recursive && item.children)
        traverse(item.children);
    }
  }

  traverse(data);
  return subtitles;
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
