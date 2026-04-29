import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { focusAtom } from 'jotai-optics';

import { toMerged } from '@asmr-collections/shared';

export interface SettingOptions {
  showWorkDetail: boolean
  keepScreenOn: boolean
  asmrone: {
    api: string
    priority: boolean
    quality: 'high' | 'low'
    recommender: boolean
  }
  storage: {
    enabled: boolean
    showMissingTags: boolean
    fallbackToAsmrOneApi: boolean
    transcode: {
      enabled: boolean
      bitrate: number
    }
  }
  smartPath: {
    enabled: boolean
    pattern: string[]
  }
}

const DEFAULT_SETTINGS: SettingOptions = {
  asmrone: {
    api: 'https://api.asmr.one',
    priority: false,
    quality: 'high',
    recommender: false
  },
  showWorkDetail: true,
  keepScreenOn: false,
  storage: {
    enabled: false,
    showMissingTags: false,
    fallbackToAsmrOneApi: true,
    transcode: {
      enabled: false,
      bitrate: 128
    }
  },
  smartPath: {
    enabled: true,
    pattern: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus']
  }
};

const storage = createJSONStorage<SettingOptions>(() => localStorage);
const deepMergeStorage = {
  ...storage,
  getItem(key: string, initialValue: SettingOptions) {
    const storedValue = storage.getItem(key, initialValue);
    if (storedValue === initialValue)
      return initialValue;

    return toMerged(initialValue, storedValue);
  }
};

export const settingOptionsAtom = atomWithStorage<SettingOptions>(
  '__settings__',
  DEFAULT_SETTINGS,
  deepMergeStorage,
  { getOnInit: true }
);

export const useSettingOptions = () => useAtom(settingOptionsAtom);

export const storageOptionsAtom = focusAtom(settingOptionsAtom, optic => optic.prop('storage'));
export const useStorageOptions = () => useAtom(storageOptionsAtom);

export const smartPathOptionsAtom = focusAtom(settingOptionsAtom, optic => optic.prop('smartPath'));
export const useSmartPathOptions = () => useAtom(smartPathOptionsAtom);
