import { toast } from 'sonner';
import { match } from 'ts-pattern';
import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { withQuery } from '@asmr-collections/shared';

import { settingOptionsAtom } from './use-setting-options';
import { findSmartPath, notifyError } from '~/utils';

import { logger } from '~/lib/logger';
import { fetcher } from '~/lib/fetcher';
import { readerZipFileSubtitles } from '~/lib/subtitle-matcher';

import type { SubtitleInfo } from './use-media-state';
import type { Tracks } from '@asmr-collections/shared';

export type TracksData =
  {
    error: Error
    data?: undefined
    fallback?: undefined
    existsInLocal: boolean
    externalSubtitles?: undefined
  } | {
    data: Tracks
    fallback: boolean
    existsInLocal: boolean
    error?: undefined
    externalSubtitles?: SubtitleInfo[]
  } | null;

// eslint-disable-next-line sukka/bool-param-default -- Need to distinguish undefined
export function useWorkDetailsTracks(id: string, smartNavigate: (path: string[]) => void, hasSubtitles?: boolean, searchPath?: string[]) {
  const settings = useAtomValue(settingOptionsAtom);
  const voiceLibrary = settings.voiceLibraryOptions;

  const onSuccess = useCallback((tracks: TracksData) => {
    if (!tracks) return;

    if (tracks.error)
      notifyError(tracks.error.cause, tracks.error.message, { id: `work-tracks-error-${id}` });

    if (tracks.fallback) {
      toast.success('成功回退至 ASMR.ONE 获取数据', {
        duration: 2000,
        description: `${id} 不存在于本地库中`,
        id: `work-tracks-fallback-${id}`
      });
    }

    if (
      settings.smartPath.enable
      && !searchPath
      && tracks.data
    ) {
      const targetPath = findSmartPath(tracks.data, settings.smartPath.pattern);

      if (targetPath && targetPath.length > 0)
        smartNavigate(targetPath);
    }
  }, [id, searchPath, settings.smartPath.enable, settings.smartPath.pattern, smartNavigate]);

  const key = match(hasSubtitles)
    .with(true, () => {
      return voiceLibrary.useLocalVoiceLibrary ? `work-tracks-${id}-local` : `work-tracks-${id}`;
    })
    .with(false, () => {
      return voiceLibrary.useLocalVoiceLibrary ? `work-tracks-${id}-local-no-subtitles` : `work-tracks-${id}-no-subtitles`;
    })
    .with(undefined, () => null)
    .exhaustive();

  // 拿出来是为了当 hasSubtitles 变化时重新请求
  const fetchFn = async () => {
    const enableLibrary = voiceLibrary.useLocalVoiceLibrary;

    let useAsmrOne: boolean | null = null;

    let exists: boolean | null = null;

    try {
      if (enableLibrary) {
        const isExists = await fetcher<{ exists: boolean }>(`/api/library/exists/${id}`);
        exists = isExists.exists;

        if (exists)
          useAsmrOne = false;
        else if (voiceLibrary.fallbackToAsmrOneApi)
          useAsmrOne = true;
      } else {
        useAsmrOne = true;
      }
    } catch (e) {
      logger.error(e, '检查本地库状态失败');
      return {
        error: new Error('获取是否存在于本地库失败', { cause: e }),
        existsInLocal: false
      };
    }

    if (useAsmrOne === null)
      return null;

    const searchParams = new URLSearchParams();
    if (useAsmrOne) {
      searchParams.append('provider', 'asmrone');
      searchParams.append('asmrOneApi', settings.asmrOneApi);
    }

    const query = useAsmrOne
      ? {
        provider: 'asmrone',
        asmrOneApi: settings.asmrOneApi
      }
      : {};

    let workTracks: Tracks;
    try {
      const key = withQuery(`/api/tracks/${id}`, query);
      workTracks = await fetcher<Tracks>(key);
    } catch (e) {
      const errorMessage = useAsmrOne
        ? '获取 ASMR.ONE 音频数据失败'
        : '获取本地音频数据失败';

      logger.error(e, '预加载作品音轨失败');
      return {
        error: new Error(errorMessage, { cause: e }),
        existsInLocal: false
      };
    }

    const tracksData = {
      data: workTracks,
      fallback: useAsmrOne && exists === false,
      existsInLocal: exists === true
    };

    if (hasSubtitles) {
      try {
        const externalSubtitles = await readerZipFileSubtitles(`/api/work/subtitles/${id}`);
        return { ...tracksData, externalSubtitles };
      } catch (e) {
        logger.error(e, '尝试加载数据库字幕失败');
        notifyError(e, '尝试加载数据库字幕失败');
        return tracksData;
      }
    }

    return tracksData;
  };

  return useSWRImmutable<TracksData>(key, fetchFn, { onSuccess });
}
