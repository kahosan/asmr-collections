import { fetcher } from '~/lib/fetcher';
import { logger } from '~/lib/logger';
import { extractFileExt } from '~/lib/utils';

export async function fetchTextTrackContent(src?: string) {
  if (!src) return;

  const fileType = extractFileExt(src).toLowerCase();

  try {
    const data = await fetcher<string | ArrayBuffer>(src);
    const text = typeof data === 'string' ? data : new TextDecoder('utf-8').decode(data);

    if (fileType !== 'lrc')
      return text;

    // LRC 转 VTT
    const lines = text.split('\n');
    const vttLines = ['WEBVTT\n'];

    for (const line of lines) {
      const timeTagMatch = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?]/.exec(line);
      if (timeTagMatch) {
        const content = line.replace(timeTagMatch[0], '').trim();
        if (!content) continue;

        const minutes = Number.parseInt(timeTagMatch[1], 10);
        const seconds = Number.parseInt(timeTagMatch[2], 10);
        const milliseconds = timeTagMatch[3] ? Number.parseInt(timeTagMatch[3].padEnd(3, '0'), 10) : 0;
        const startTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;

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
