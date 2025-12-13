import { useCallback, useMemo } from 'react';

import { match } from 'ts-pattern';
import { atom, useAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { storageOptionsAtom } from './use-setting-options';

export type TranscodeMode = 'persistence' | 'temporary' | 'disable';
export interface TranscodeOptions {
  mode: TranscodeMode
  bitrate: number
}

export const transcodeStorageAtom = focusAtom(storageOptionsAtom, optic => optic.prop('transcode'));
export const transcodeTempAtom = atom({ enabled: false });

export function useTranscodeOptions() {
  const [storageOptions, setStorageOptions] = useAtom(transcodeStorageAtom);
  const [tempOptions, setTempOptions] = useAtom(transcodeTempAtom);

  let mode: TranscodeMode = 'disable';
  if (storageOptions.enabled)
    mode = 'persistence';
  else if (tempOptions.enabled)
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
      enabled: false
    };

    match(draft.mode)
      .with('persistence', () => {
        nextStorageState.enabled = true;
        setTempOptions({ enabled: false });
      })
      .with('temporary', () => {
        setTempOptions({ enabled: true });
      })
      .with('disable', () => {
        // disable
        setTempOptions({ enabled: false });
      })
      .exhaustive();

    setStorageOptions(nextStorageState);
  }, [options, setStorageOptions, setTempOptions]);

  return [options, setOptions] as const;
}
