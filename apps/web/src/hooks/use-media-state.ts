import { atom } from 'jotai';

import type { Work, Track, Tracks, SubtitleInfo } from '@asmr-collections/shared';

export interface MediaState {
  open: boolean
  tracks?: Tracks
  currentTrack?: Track
  allSubtitles?: SubtitleInfo[]
  work?: Pick<Work, 'id' | 'name' | 'cover' | 'artists' | 'favorited'>
}

export const mediaStateAtom = atom<MediaState>({
  open: false
});
