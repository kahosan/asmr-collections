import { preload } from 'swr';

import { workInfoFetcher } from '~/hooks/use-work-info';

export function preloadWorkDetails(id: string, cause: 'preload' | 'enter' | 'stay') {
  preload(`work-info-${id}`, () => workInfoFetcher(id, cause));
}
