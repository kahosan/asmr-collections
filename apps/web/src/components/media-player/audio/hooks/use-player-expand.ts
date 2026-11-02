import { atom, useAtom } from 'jotai';

export const playerExpandAtom = atom(false);
export const usePlayerExpand = () => useAtom(playerExpandAtom);
