import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { focusAtom } from 'jotai-optics';

import { toMerged } from '@asmr-collections/shared';

export interface SettingOptions {
  kikoeru: string
  asmrOneApi: string
  useAsmrOneRecommender: boolean
  showWorkDetail: boolean
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

const DEFAULT_SETTINGS = {
  kikoeru: 'https://asmr.one/work',
  asmrOneApi: 'https://api.asmr.one',
  useAsmrOneRecommender: false,
  showWorkDetail: true,
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
