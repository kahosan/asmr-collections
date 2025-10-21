import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const hiddenImageAtom = atomWithStorage('hidden-image', false);
export const useHiddenImage = () => useAtom(hiddenImageAtom);
