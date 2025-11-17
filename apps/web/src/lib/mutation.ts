import { mutate } from 'swr';

import { preloadWorkDetails } from '~/providers/router/preload';

export function mutateWorkInfo(id: string) {
  return mutate(
    `work-info-${id}`,
    () => preloadWorkDetails(id, 'enter', true),
    { revalidate: false }
  );
}

export function mutateWorks() {
  return mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
}

export function mutateTracks(id: string) {
  mutate(`work-tracks-${id}`);
  mutate(`work-tracks-local-${id}`);
}
