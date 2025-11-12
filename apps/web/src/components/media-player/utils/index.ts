import { fetcher } from '~/lib/fetcher';
import { logger } from '~/lib/logger';
import { extractFileExt } from '~/lib/utils';

function decodeText(data: ArrayBuffer): string {
  const encodings = ['gbk', 'gb2312', 'gb18030', 'utf-8'];

  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true });
      const text = decoder.decode(data);
      // 检查是否有乱码(包含大量替换字符)
      const replacementCharCount = (text.match(/�/g) || []).length;
      if (replacementCharCount / text.length < 0.1)
        return text;
    } catch {
      continue;
    }
  }

  return new TextDecoder('utf-8').decode(data);
}

export async function fetchTextTrackContent(src?: string) {
  if (!src) return;

  const fileType = extractFileExt(src).toLowerCase();

  try {
    const data = await fetcher<string | ArrayBuffer>(src);
    const text = typeof data === 'string' ? data : decodeText(data);

    if (fileType !== 'lrc')
      return text;

    // LRC 转 VTT
    const lines = text.split('\n');
    const vttLines = ['WEBVTT\n'];

    const matchReg = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?]/;

    for (const line of lines) {
      const timeTagMatch = matchReg.exec(line);

      if (timeTagMatch) {
        const content = line.replace(timeTagMatch[0], '').trim();
        if (!content) continue;

        const minutes = Number.parseInt(timeTagMatch[1], 10);
        const seconds = Number.parseInt(timeTagMatch[2], 10);
        const milliseconds = timeTagMatch[3] ? Number.parseInt(timeTagMatch[3].padEnd(3, '0'), 10) : 0;
        const startTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;

        const nextLine = lines.at(lines.indexOf(line) + 1);
        if (nextLine) {
          const nextTimeTagMatch = matchReg.exec(nextLine);
          if (nextTimeTagMatch) {
            const nextMinutes = Number.parseInt(nextTimeTagMatch[1], 10);
            const nextSeconds = Number.parseInt(nextTimeTagMatch[2], 10);
            const nextMilliseconds = nextTimeTagMatch[3] ? Number.parseInt(nextTimeTagMatch[3].padEnd(3, '0'), 10) : 0;
            const endTime = `${String(nextMinutes).padStart(2, '0')}:${String(nextSeconds).padStart(2, '0')}.${String(nextMilliseconds).padStart(3, '0')}`;

            vttLines.push(`${startTime} --> ${endTime}\n${content}\n`);
            continue;
          }
        }

        const endSeconds = seconds + 5;
        const endMinutes = minutes + Math.floor(endSeconds / 60);
        const adjustedEndSeconds = endSeconds % 60;
        const endTime = `${String(endMinutes).padStart(2, '0')}:${String(adjustedEndSeconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;

        vttLines.push(`${startTime} --> ${endTime}\n${content}\n`);
      }
    }

    return vttLines.join('\n');
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
