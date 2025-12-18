import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { HTTPError, withQuery } from '@asmr-collections/shared';

import { settingOptionsAtom } from './use-setting-options';
import { findSmartPath, notifyError } from '~/utils';

import { logger } from '~/lib/logger';
import { fetcher } from '~/lib/fetcher';
import { readerZipFileSubtitles } from '~/lib/subtitle-matcher';

import type { Tracks, TracksResponse, SubtitleInfo } from '@asmr-collections/shared';

export type TracksData =
  {
    error: Error
    data?: undefined
    trackStorage?: undefined
    inStorage: boolean
    externalSubtitles?: undefined
  } | {
    data: Tracks
    inStorage: boolean
    trackStorage?: TracksResponse['storage']
    error?: undefined
    externalSubtitles?: SubtitleInfo[]
  } | null;

// eslint-disable-next-line sukka/bool-param-default -- Need to distinguish undefined
export function useWorkDetailsTracks(id: string, smartNavigate: (path: string[]) => void, hasSubtitles?: boolean, searchPath?: string[]) {
  const settings = useAtomValue(settingOptionsAtom);
  const storage = settings.storage;

  const onSuccess = useCallback((tracks: TracksData) => {
    if (!tracks) return;

    if (tracks.error)
      notifyError(tracks.error.cause, tracks.error.message, { id: `work-tracks-error-${id}` });

    if (
      settings.smartPath.enabled
      && !searchPath
      && tracks.data
    ) {
      const targetPath = findSmartPath(tracks.data, settings.smartPath.pattern);

      if (targetPath && targetPath.length > 0)
        smartNavigate(targetPath);
    }
  }, [id, searchPath, settings.smartPath.enabled, settings.smartPath.pattern, smartNavigate]);

  function getQuery(provider: 'asmrone' | 'local') {
    if (provider === 'asmrone') {
      return {
        provider: 'asmrone',
        api: settings.asmrone.api
      };
    }
    return {};
  }

  const fetchFn = async (): Promise<TracksData> => {
    let tracks: Tracks | undefined;
    let inStorage = false;
    let trackStorage: TracksResponse['storage'] | undefined;

    if (storage.enabled) {
      try {
        const key = withQuery(`/api/tracks/${id}`, getQuery('local'));
        const data = await fetcher<TracksResponse>(key);
        tracks = data.tracks;
        trackStorage = data.storage;
        inStorage = true;
      } catch (e) {
        if (e instanceof HTTPError && e.status === 404) {
          inStorage = false;
        } else {
          logger.error(e, '获取本地音频数据失败');
          return {
            error: new Error('获取本地音频数据失败', { cause: e }),
            inStorage: false
          };
        }
      }
    }

    // 不存在于本地，且允许回退到 ASMR.ONE API，或本地存储未启用
    if (!inStorage && (!storage.enabled || storage.fallbackToAsmrOneApi)) {
      try {
        const key = withQuery(`/api/tracks/${id}`, getQuery('asmrone'));
        tracks = await fetcher<Tracks>(key);
        trackStorage = { type: 'asmrone', name: 'ASMR.ONE' };
      } catch (e) {
        logger.error(e, '获取 ASMR.ONE 音频数据失败');
        return {
          error: new Error('获取 ASMR.ONE 音频数据失败', { cause: e }),
          inStorage: false
        };
      }
    }

    if (!tracks) return null;

    const tracksData = {
      data: tracks,
      trackStorage,
      inStorage
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

  const key = hasSubtitles === undefined
    ? null
    : [`work-tracks-${id}`, storage.enabled, storage.fallbackToAsmrOneApi, hasSubtitles];

  return useSWRImmutable<TracksData>(key, fetchFn, { onSuccess });
}
