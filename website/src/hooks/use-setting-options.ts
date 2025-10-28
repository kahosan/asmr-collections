import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { focusAtom } from 'jotai-optics';

export interface SettingOptions {
  kikoeru: string
  asmrOneApi: string
  showWorkDetail: boolean
  voiceLibraryOptions: {
    useLocalVoiceLibrary: boolean
    showMissingTagsInLocalVL: boolean
    fallbackToAsmrOneApi: boolean
  }
  smartPath: {
    enable: boolean
    pattern: string[]
  }
}

export const settingOptionsAtom = atomWithStorage<SettingOptions>('__settings__', {
  kikoeru: 'https://asmr.one/work',
  asmrOneApi: 'https://api.asmr-200.com',
  showWorkDetail: true,
  voiceLibraryOptions: {
    useLocalVoiceLibrary: false,
    showMissingTagsInLocalVL: false,
    fallbackToAsmrOneApi: true
  },
  smartPath: {
    enable: true,
    pattern: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus']
  }
}, undefined, { getOnInit: true });
export const useSettingOptions = () => useAtom(settingOptionsAtom);

export const voiceLibraryOptionsAtom = focusAtom(settingOptionsAtom, optic => optic.prop('voiceLibraryOptions'));
export const useVoiceLibraryOptions = () => useAtom(voiceLibraryOptionsAtom);

export const smartPathOptionsAtom = focusAtom(settingOptionsAtom, optic => optic.prop('smartPath'));
export const useSmartPathOptions = () => useAtom(smartPathOptionsAtom);
