import type { Tracks } from '~/types/tracks';
import { fetcher, HTTPError } from '~/lib/fetcher';

export async function fetchAsmrOneTracks(id: string, asmrOneApi: string) {
  try {
    return await fetcher<Tracks>(`${asmrOneApi}/api/tracks/${id.replace('RJ', '')}`);
  } catch (e) {
    if (e instanceof HTTPError && e.status === 404)
      throw new Error(e.data?.error || '作品不存在于 asmr.one');

    throw e;
  };
}
