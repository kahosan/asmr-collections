import { atom } from 'jotai';
import type { Track } from '~/types/tracks';
import type { Work } from '~/types/work';

export interface MediaTrack extends Track {
  subtitles?: {
    src?: string
  }
}

export interface MediaState {
  open: boolean
  tracks?: MediaTrack[]
  currentTrack?: MediaTrack
  work?: Work
}

export const mediaAtom = atom<MediaState>({
  open: false
});
