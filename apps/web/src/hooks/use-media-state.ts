import { atom } from 'jotai';

import type { Work, Track } from '@asmr-collections/shared';

export interface SubtitleInfo {
  title: string
  url?: string
  content?: string
}

export interface MediaTrack extends Track {
  subtitles?: SubtitleInfo
  lastPlayedAt?: number
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
