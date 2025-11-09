import { atom } from 'jotai';
import type { Track } from '~/types/tracks';
import type { Work } from '~/types/work';

export interface SubtitleInfo {
  title: string
  url: string
}

export interface MediaTrack extends Track {
  subtitles?: SubtitleInfo
}

export interface MediaState {
  open: boolean
  tracks?: MediaTrack[]
  currentTrack?: MediaTrack
  allSubtitles?: SubtitleInfo[]
  work?: Work
}

export const mediaStateAtom = atom<MediaState>({
  open: false
});
