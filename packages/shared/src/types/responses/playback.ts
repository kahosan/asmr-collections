import type { Playback } from '../playback';

export type PlaybackResponse = Playback;

export interface PlaybacksResponse {
  page: number
  limit: number
  total: number
  data: Playback[]
}
