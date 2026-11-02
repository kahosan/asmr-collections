import { decodeText, extname, lrcToVtt } from '@asmr-collections/shared';

import { fetcher } from '~/lib/fetcher';
import { logger } from '~/lib/logger';

// 浏览器原生字幕只支持 WebVTT
export function srtToVtt(text: string): string {
  const body = text
    .replace(/^\uFEFF/, '')
    .replaceAll(/\r\n?/g, '\n')
    .replaceAll(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return `WEBVTT\n\n${body}`;
}

export async function fetchTextTrackContent(src: string | undefined, type?: 'vtt' | 'srt') {
  if (!src) return;

  const fileType = extname(src).toLowerCase();

  try {
    const data = await fetcher<string | ArrayBuffer>(src);
    const text = typeof data === 'string' ? data : decodeText(data);

    if (fileType === 'lrc')
      return lrcToVtt(text);

    if (fileType === 'srt' || type === 'srt')
      return srtToVtt(text);

    return text;
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
