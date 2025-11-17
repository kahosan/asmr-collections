import { useAtomValue } from 'jotai';
import useSWRImmutable from 'swr/immutable';
import type { Tracks } from '~/types/tracks';
import { settingOptionsAtom } from './use-setting-options';
import { fetcher } from '~/lib/fetcher';
import { logger } from '~/lib/logger';
import { toast } from 'sonner';
import { findSmartPath, notifyError } from '~/utils';
import { useCallback } from 'react';

export type TracksData =
  {
    error: Error
    data?: undefined
    fallback?: undefined
    existsInLocal?: undefined
  } | {
    data: Tracks
    fallback: boolean
    existsInLocal: boolean
    error?: undefined
  } | null;

export function useWorkDetailsTracks(id: string, smartNavigate: (path: string[]) => void, searchPath?: string[]) {
  const settings = useAtomValue(settingOptionsAtom);
  const voiceLibrary = settings.voiceLibraryOptions;

  const onSuccess = useCallback((tracks: TracksData) => {
    if (!tracks) return;

    if (tracks.error)
      notifyError(tracks.error.cause, tracks.error.message);

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

  return useSWRImmutable(
    voiceLibrary.useLocalVoiceLibrary ? `work-tracks-local-${id}` : `work-tracks-${id}`,
    async () => {
      const enableLibrary = voiceLibrary.useLocalVoiceLibrary;

      const asmrOneApi = `/proxy/${encodeURIComponent(`${settings.asmrOneApi}/api/tracks/${id.replace('RJ', '')}`)}`;
      const localApi = `/api/tracks/${id}`;

      let tracksApi: string | null = null;
      let exists: boolean | null = null;

      try {
        if (enableLibrary) {
          const isExists = await fetcher<{ exists: boolean }>(`/api/library/exists/${id}`);
          exists = isExists.exists;

          if (exists)
            tracksApi = localApi;
          else if (voiceLibrary.fallbackToAsmrOneApi)
            tracksApi = asmrOneApi;
        } else {
          tracksApi = asmrOneApi;
        }
      } catch (e) {
        logger.error(e, '检查本地库状态失败');
        return {
          error: new Error('获取是否存在于本地库失败', { cause: e })
        };
      }

      if (!tracksApi)
        return null;

      try {
        const workTracks = await fetcher<Tracks>(tracksApi);
        return {
          data: workTracks,
          fallback: tracksApi === asmrOneApi && exists === false,
          existsInLocal: exists === true
        };
      } catch (e) {
        const errorMessage = tracksApi === localApi
          ? '获取本地音频数据失败'
          : '获取 ASMR.ONE 音频数据失败';

        logger.error(e, '预加载作品音轨失败');
        return { error: new Error(errorMessage, { cause: e }) };
      }
    }, {
      onSuccess,
      suspense: true
    }
  );
}
