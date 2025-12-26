import type { Jsonify } from '../utils';
import type { Track, Tracks } from './track';
import type { ServerWork, Work } from './work';

export interface ServerPlayback {
  work: Pick<ServerWork, 'id' | 'name' | 'cover' | 'circle' | 'artists'>
  track: Track
  tracks: Tracks
  position: number
  count: number
  lastAt: Date
  createdAt: Date
  updatedAt: Date
}

export type Playback = Jsonify<
  Omit<ServerPlayback, 'work'>
  & {
    work: Pick<Work, 'id' | 'name' | 'cover' | 'circle' | 'artists' | 'exists' | 'subtitles'>
  }
>;
