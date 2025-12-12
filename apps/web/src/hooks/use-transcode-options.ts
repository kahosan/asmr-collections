import { useCallback, useMemo } from 'react';

import { atom, useAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { voiceLibraryOptionsAtom } from './use-setting-options';

export type TranscodeMode = 'persistence' | 'temporary' | 'disable';
export interface TranscodeOptions {
  mode: TranscodeMode
  bitrate: number
}

export const transcodeStorageAtom = focusAtom(voiceLibraryOptionsAtom, optic => optic.prop('transcode'));
export const transcodeTempAtom = atom({ enable: false });

export function useTranscodeOptions() {
  const [storageOptions, setStorageOptions] = useAtom(transcodeStorageAtom);
  const [tempOptions, setTempOptions] = useAtom(transcodeTempAtom);

  let mode: TranscodeMode = 'disable';
  if (storageOptions.enable)
    mode = 'persistence';
  else if (tempOptions.enable)
    mode = 'temporary';

  const options = useMemo(() => ({
    mode,
    bitrate: storageOptions.bitrate
  }), [mode, storageOptions.bitrate]);

  const setOptions = useCallback((updater: (draft: TranscodeOptions) => void) => {
    const draft = structuredClone(options);
    updater(draft);

    const nextStorageState = {
      bitrate: draft.bitrate,
      enable: false
    };

    switch (draft.mode) {
      case 'persistence':
        nextStorageState.enable = true;
        setTempOptions({ enable: false });
        break;
      case 'temporary':
        setTempOptions({ enable: true });
        break;
      default:
        // disable
        setTempOptions({ enable: false });
        break;
    }

    setStorageOptions(nextStorageState);
  }, [options, setStorageOptions, setTempOptions]);

  return [options, setOptions] as const;
}
