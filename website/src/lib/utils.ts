import type { ExternalToast } from 'sonner';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';

import { HTTPError } from './fetcher';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  if (error instanceof HTTPError) {
    let message = error.message;
    if ('data' in error) {
      message += ': ';
      message += typeof error.data === 'object' ? Object.values(error.data).join(', ') : error.data;
    }
    toast.error(text, {
      ...options,
      description: options?.description ?? message
    });
  }

  toast.error(text, {
    ...options,
    description: error instanceof Error ? error.message : undefined
  });
}

// 使用 >>> 0 处理无后缀情况：lastIndexOf 返回 -1 时转为超大正数
export function extractFileExt(name?: string) {
  return name?.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2);
}
