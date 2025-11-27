import { extname } from '@asmr-collections/shared';

import { fetcher } from '~/lib/fetcher';
import { logger } from '~/lib/logger';

import { decodeText, lrcToVtt } from '~/lib/subtitle-matcher';

export async function fetchTextTrackContent(src?: string) {
  if (!src) return;

  const fileType = extname(src).toLowerCase();

  try {
    const data = await fetcher<string | ArrayBuffer>(src);
    const text = typeof data === 'string' ? data : decodeText(data);

    if (fileType !== 'lrc')
      return text;

    return lrcToVtt(text);
  } catch (e) {
    logger.error(e, `获取字幕文本失败: ${src}`);
  }
}

export function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = ua.includes('WebKit');
  const isNotChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);

  return isIOS && isWebkit && isNotChrome;
}
