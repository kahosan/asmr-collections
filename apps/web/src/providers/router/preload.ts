import { preload } from 'swr';

import { createStore } from 'jotai';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import { logger } from '~/lib/logger';
import { fetcher, HTTPError } from '~/lib/fetcher';

const store = createStore();

class WorkDetailsError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'WorkDetailsError';
    this.cause = cause;
  }
}

interface PreloadWorkDetailsResult {
  info?: unknown
  tracks?: {
    data: unknown
    fallback: boolean
    existsInLocal: boolean
  } | null
  error?: Error
}

export function preloadWorkDetails(id: string) {
  const settings = store.get(settingOptionsAtom);
  const voiceLibrary = settings.voiceLibraryOptions;
  const enableLibrary = voiceLibrary.useLocalVoiceLibrary;

  const asmrOneApi = `/proxy/${encodeURIComponent(`${settings.asmrOneApi}/api/tracks/${id.replace('RJ', '')}`)}`;
  const localApi = `/api/tracks/${id}`;

  async function preloadFetcher(): Promise<PreloadWorkDetailsResult> {
    let workInfo;
    try {
      workInfo = await fetcher(`/api/work/${id}`);
    } catch (e) {
      if (e instanceof HTTPError && e.status === 404) {
        try {
          logger.warn(`${id} 不存在于数据库中，尝试使用 DLsite 预加载作品信息`);
          const data = await fetcher<Record<string, string>>(`/api/work/info/${id}`);
          workInfo = { ...data, exists: false };
        } catch (e) {
          logger.error(e, '预加载作品信息失败');
          return { error: new WorkDetailsError('作品不存在于数据库中，且 DLsite 获取失败', e) };
        }
      }
      logger.error(e, '预加载作品信息失败');
      return { error: new WorkDetailsError('获取作品信息失败', e) };
    }

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
        info: workInfo,
        error: new WorkDetailsError('获取是否存在于本地库失败', e)
      };
    }

    if (!tracksApi)
      return { info: workInfo, tracks: null };

    try {
      const workTracks = await fetcher(tracksApi);
      return {
        info: workInfo,
        tracks: {
          data: workTracks,
          fallback: tracksApi === asmrOneApi && exists === false,
          existsInLocal: exists === true
        }
      };
    } catch (e) {
      const errorMessage = tracksApi === localApi
        ? '获取本地音频数据失败'
        : '获取 ASMR.ONE 音频数据失败';

      logger.error(e, '预加载作品音轨失败');
      return {
        info: workInfo,
        error: new WorkDetailsError(errorMessage, e)
      };
    }
  }

  preload(`work-details-${id}`, preloadFetcher);
}
