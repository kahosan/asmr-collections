import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface SettingOptions {
  kikoeru: string
  selectedCloseMenu: boolean
  useLocalVoiceLibrary: boolean
  showWorkDetail: boolean
  isUseLocalVLShowExistTag: boolean
}

export const settingOptionsAtom = atomWithStorage<SettingOptions>('__settings__', {
  kikoeru: 'https://asmr.one/work',
  selectedCloseMenu: false,
  useLocalVoiceLibrary: false,
  showWorkDetail: true,
  isUseLocalVLShowExistTag: false
});

export const useSettingOptions = () => useAtom(settingOptionsAtom);
