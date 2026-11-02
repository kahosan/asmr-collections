import useSWRImmutable from 'swr/immutable';

import { fetchTextTrackContent, srtToVtt } from '../utils';

import type { SubtitleInfo } from '@asmr-collections/shared';

/**
 * 把当前字幕转换为 WebVTT，返回供原生 <track> 使用的 data url
 * 使用 data url 而不是 blob url，避免 SWR 缓存的地址被提前释放
 */
export function useSubtitleSource(subtitles: SubtitleInfo | undefined) {
  const fetcher = async () => {
    if (!subtitles) return;

    const stateContent = subtitles.content && subtitles.type === 'srt'
      ? srtToVtt(subtitles.content)
      : subtitles.content;

    const content = (await fetchTextTrackContent(subtitles.url, subtitles.type)) || stateContent;
    if (!content) return;

    return `data:text/vtt;charset=utf-8,${encodeURIComponent(content)}`;
  };

  const { data } = useSWRImmutable(
    subtitles ? ['subtitle-source', subtitles.url, subtitles.content, subtitles.type] : null,
    fetcher
  );

  return subtitles ? data : undefined;
}
