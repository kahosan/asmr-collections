import { produce } from 'immer';
import { useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Track } from '~/types/tracks';

interface PlayHistoryItem {
  id: string
  track: Track
  lastPlayedAt: number
}

type PlayHistory = PlayHistoryItem[];

export const playHistoryAtom = atomWithStorage<PlayHistory>('__play-history__', [], undefined, {
  getOnInit: true
});

export function usePlayHistoryUpdate() {
  const setPlayHistory = useSetAtom(playHistoryAtom);

  return (id: string, lastPlayedAt: number, track: Track) => {
    setPlayHistory(prev => produce(prev, draft => {
      const index = draft.findIndex(item => item.id === id);
      if (index === -1) {
        draft.push({ id, lastPlayedAt, track });
      } else {
        draft[index].lastPlayedAt = lastPlayedAt;
        draft[index].track = track;
      }
    }));
  };
}

export function usePlayHistoryValue(id: string) {
  return useAtomValue(playHistoryAtom).find(item => item.id === id);
}
