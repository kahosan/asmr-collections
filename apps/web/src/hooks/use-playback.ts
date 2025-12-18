import useSWRMutation from 'swr/mutation';

import { PlaybackUpsertSchema } from '@asmr-collections/shared';
import type { PlaybackUpsert } from '@asmr-collections/shared';

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
