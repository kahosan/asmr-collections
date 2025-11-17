import { mutate } from 'swr';

import { preloadWorkDetails } from '~/providers/router/preload';

export function mutateWorkInfo(id: string) {
  return mutate(`work-details-${id}`, async prev => {
    const data = await preloadWorkDetails(id, 'info');

    return { ...prev, info: data?.info ?? prev?.info };
  }, { revalidate: false });
}

export function mutateWorks() {
  return mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
}

export function mutateTracks(id: string) {
  return mutate(`work-details-${id}`, () => {
    return preloadWorkDetails(id, 'tracks');
  }, { revalidate: false });
}
