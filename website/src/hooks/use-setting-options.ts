import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SettingOptions {
  kikoeru: string
  asmrOneApi: string
  useLocalVoiceLibrary: boolean
  showWorkDetail: boolean
  showMissingTagsInLocalVL: boolean
  fallbackToAsmrOneApi: boolean
}

export const settingOptionsAtom = atomWithStorage<SettingOptions>('__settings__', {
  kikoeru: 'https://asmr.one/work',
  asmrOneApi: 'https://api.asmr-200.com',
  useLocalVoiceLibrary: false,
  showWorkDetail: true,
  showMissingTagsInLocalVL: false,
  fallbackToAsmrOneApi: true
}, undefined, { getOnInit: true });

export const useSettingOptions = () => useAtom(settingOptionsAtom);
