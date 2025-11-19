import Fuse from 'fuse.js';
import { extractFileExt } from '~/utils';

import { HttpReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';

import type { IFuseOptions } from 'fuse.js';
import type { Tracks } from '~/types/tracks';
import type { SubtitleInfo } from '~/hooks/use-media-state';

export class SubtitleMatcher {
  private readonly fuses: Array<Fuse<SubtitleInfo>>;
  private readonly fallbackFuse: Fuse<SubtitleInfo>;
  private readonly earlyExitScore: number;

  constructor(
    subtitles: SubtitleInfo[][],
    options?: IFuseOptions<SubtitleInfo>,
    earlyExitScore = 0.2
  ) {
    const fuseOptions = {
      keys: ['title'],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      ...options
    };

    this.earlyExitScore = earlyExitScore;

    this.fuses = subtitles.map(group => new Fuse(group, fuseOptions));
    this.fallbackFuse = new Fuse(subtitles.flat(), { ...fuseOptions, threshold: 1 });
  }

  find(trackTitle: string, scoreThreshold = 0.4) {
    let resultItem: { item: SubtitleInfo, score: number } | undefined;

    for (const fuse of this.fuses) {
      const results = fuse.search(trackTitle);
      const result = results.at(0);

      if (
        result?.score !== undefined
        && result.score <= scoreThreshold
        && (!resultItem || result.score < resultItem.score)
      ) {
        if (result.score <= this.earlyExitScore)
          return result.item;

        resultItem = { item: result.item, score: result.score };
      }
    }

    // fallback
    if (!resultItem) {
      const results = this.fallbackFuse.search(trackTitle);
      const result = results.at(0);
      if (result?.score !== undefined)
        return result.item;
    }

    return resultItem?.item;
  }
}

/**
 * 收集字幕文件
 * @param data - 轨道数据
 * @param recursive - 是否递归收集子目录的字幕文件,默认为 false
 * @returns 字幕信息数组
 */
export function collectSubtitles(data: Tracks | undefined | null, recursive = false): SubtitleInfo[] {
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

/**
 * 获取数据库中的字幕文件
 */
export async function readerZipFileSubtitles(src: string): Promise<SubtitleInfo[]> {
  const zipReader = new ZipReader(new HttpReader(src));

  const subtitles: SubtitleInfo[] = [];
  const supportedExtensions = new Set(['srt', 'lrc', 'vtt']);

  for await (const entry of zipReader.getEntriesGenerator()) {
    if (entry.directory) continue;

    let filename = decodeText(entry.rawFilename);
    const ext = extractFileExt(filename);

    filename = filename.split('/').pop() || filename;

    const content = await entry.getData(new Uint8ArrayWriter());

    if (supportedExtensions.has(ext)) {
      let c = decodeText(content);
      if (ext === 'lrc')
        c = lrcToVtt(c);

      subtitles.push({ title: filename, content: c });
    }
  }

  await zipReader.close();
  return subtitles;
}

export function decodeText(data: ArrayBuffer | Uint8Array): string {
  const encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030'];

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

export function lrcToVtt(text: string): string {
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
}
