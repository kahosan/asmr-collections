import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const hiddenImageAtom = atomWithStorage('hidden-image', false, undefined, {
  getOnInit: true
});

export const useHiddenImage = () => useAtom(hiddenImageAtom);
