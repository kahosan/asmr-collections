import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SettingOptions {
  kikoeru: string
  asmrOneApi: string
  prioritizeDLsite: boolean
  useLocalVoiceLibrary: boolean
  showWorkDetail: boolean
  isUseLocalVLShowExistTag: boolean
  fallbackToAsmrOneApi: boolean
}

export const settingOptionsAtom = atomWithStorage<SettingOptions>('__settings__', {
  kikoeru: 'https://asmr.one/work',
  asmrOneApi: 'https://api.asmr-200.com',
  prioritizeDLsite: true,
  useLocalVoiceLibrary: false,
  showWorkDetail: true,
  isUseLocalVLShowExistTag: false,
  fallbackToAsmrOneApi: true
}, undefined, { getOnInit: true });

export const useSettingOptions = () => useAtom(settingOptionsAtom);
