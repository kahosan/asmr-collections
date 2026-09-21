import {
  createRoute,
  redirect,
  stripSearchParams
} from '@tanstack/react-router';
import type { InferFullSearchSchema } from '@tanstack/react-router';

import App from '~/app';

import { WorkDetailsSkeleton } from '~/pages/work-details/components/skeleton';

import { rootRoute } from '.';

import { preloadWorkDetails } from './preload';
import { RootSearchSchema, IndexSearchSchema, PlaybackSearchSchema, WorkDetailsSearchSchema, PlaylistSearchSchema } from './schemas';

import { createRandomSeed } from '~/utils';

import { INDEX_DEFAULT_SEARCH_VALUES, ROOT_DEFAULT_SEARCH_VALUES } from '@asmr-collections/shared';

export const appRoute = createRoute({
  id: 'app',
  validateSearch: IndexSearchSchema.extend(RootSearchSchema.shape),
  getParentRoute: () => rootRoute,
  search: {
    middlewares: [
      stripSearchParams({ ...ROOT_DEFAULT_SEARCH_VALUES, ...INDEX_DEFAULT_SEARCH_VALUES }),
      ({ search, next }) => {
        const result = next(search);

        if (result.sort === 'random' && !result.seed)
          return { ...result, seed: createRandomSeed() };

        if (result.sort !== 'random' && result.seed)
          return { ...result, seed: undefined };

        return result;
      }
    ]
  }
});

export const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: () => <App />
});

export type WorkDetailsSearchParams = InferFullSearchSchema<typeof workDetailsRoute>;

export const workDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-details/$id',
  staleTime: Infinity,
  async loader({ params, cause }) {
    const id = params.id;
    const data = await preloadWorkDetails(id, cause);

    if (data !== null && data.id !== id) {
      const resolvedId = data.id;
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- redirect
      throw redirect({
        to: '/work-details/$id',
        params: { id: resolvedId },
        search: p => ({ ...p, t: params.id }),
        replace: true
      });
    }

    return { id, data };
  },
  pendingComponent: () => <WorkDetailsSkeleton />,
  pendingMs: 0,
  pendingMinMs: 150,
  validateSearch: WorkDetailsSearchSchema
}).lazy(() => import('~/pages/work-details').then(d => d.default));

export const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings'
}).lazy(() => import('~/pages/settings').then(d => d.default));

export const playbackRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/playback',
  validateSearch: PlaybackSearchSchema
}).lazy(() => import('~/pages/playback').then(d => d.default));

export const playlistsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/playlists',
  validateSearch: PlaylistSearchSchema
}).lazy(() => import('~/pages/playlists').then(d => d.default));

export const discoverRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/discover'
}).lazy(() => import('~/pages/discover').then(d => d.default));

export const playlistRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/playlists/$id',
  validateSearch: PlaylistSearchSchema
}).lazy(() => import('~/pages/playlists/playlist').then(d => d.default));
