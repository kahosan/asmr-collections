import { atom, useAtom } from 'jotai';

const playerExpandAtom = atom(false);
export const usePlayerExpand = () => useAtom(playerExpandAtom);
