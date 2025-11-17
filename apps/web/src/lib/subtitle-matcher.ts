import Fuse from 'fuse.js';
import { extractFileExt } from '~/utils';

import type { IFuseOptions } from 'fuse.js';
import type { Tracks } from '~/types/tracks';
import type { SubtitleInfo } from '~/hooks/use-media-state';

export class SubtitleMatcher {
  private readonly fuses: Array<Fuse<SubtitleInfo>>;
  private readonly fallbackFuse: Fuse<SubtitleInfo>;

  constructor(
    subtitles: SubtitleInfo[][],
    options?: IFuseOptions<SubtitleInfo>,

    private readonly earlyExitScore = 0.2
  ) {
    const fuseOptions = {
      keys: ['title'],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      ...options
    };

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
