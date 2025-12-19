import type { Jsonify } from '../utils';
import type { ServerWork } from './work';
import type { Track, Tracks } from './track';

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

export type Playback = Jsonify<ServerPlayback>;
