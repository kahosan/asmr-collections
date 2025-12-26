import useSWRMutation from 'swr/mutation';

import { PlaybackUpsertSchema } from '@asmr-collections/shared';
import type { PlaybackUpsert, Track, Tracks } from '@asmr-collections/shared';

type PlaybackMutationArgs = PlaybackUpsert & { id: string };

async function fetcher(url: string, { arg }: { arg: PlaybackMutationArgs }) {
  const { id, ...rest } = arg;
  return fetch(`${url}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(PlaybackUpsertSchema.parse(rest)),
    keepalive: true
  });
}

export function usePlayback() {
  return useSWRMutation('/api/playback', fetcher);
}

export function prepareTracks(tracks: Track): Track;
export function prepareTracks(tracks: Tracks | undefined): Tracks | undefined;
export function prepareTracks(tracks: Track | (Tracks | undefined)): Track | Tracks | undefined {
  if (!tracks) return tracks;

  // 有 content 代表是从数据库中加载的字幕

  if (Array.isArray(tracks)) {
    return tracks.map(track => ({
      ...track,
      subtitles: track.subtitles?.content ? undefined : track.subtitles
    }));
  }

  return {
    ...tracks,
    subtitles: tracks.subtitles?.content ? undefined : tracks.subtitles
  };
}
