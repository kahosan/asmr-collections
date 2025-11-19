import type { Tracks } from '~/types/tracks';
import { fetcher } from '~/lib/fetcher';

export function fetchAsmrOneTracks(id: string, asmrOneApi: string) {
  return fetcher<Tracks>(`${asmrOneApi}/api/tracks/${id.replace('RJ', '')}`);
}
