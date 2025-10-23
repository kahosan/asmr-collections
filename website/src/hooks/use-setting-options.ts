import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SettingOptions {
  kikoeru: string
  asmrOneApi: string
  selectedCloseMenu: boolean
  prioritizeDLsite: boolean
  useLocalVoiceLibrary: boolean
  showWorkDetail: boolean
  isUseLocalVLShowExistTag: boolean
}

export const settingOptionsAtom = atomWithStorage<SettingOptions>('__settings__', {
  kikoeru: 'https://asmr.one/work',
  asmrOneApi: 'https://api.asmr-200.com',
  selectedCloseMenu: false,
  prioritizeDLsite: true,
  useLocalVoiceLibrary: false,
  showWorkDetail: true,
  isUseLocalVLShowExistTag: false
});

export const useSettingOptions = () => useAtom(settingOptionsAtom);
