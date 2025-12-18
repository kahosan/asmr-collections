import type { Track } from './track';
import type { Jsonify } from '../utils';
import type { ServerWork } from './work';

export interface ServerPlayback {
  work: Pick<ServerWork, 'id' | 'name' | 'cover' | 'circle' | 'artists'>
  track: Track
  position: number
  count: number
  lastAt: Date
  createdAt: Date
  updatedAt: Date
}

export type Playback = Jsonify<ServerPlayback>;
