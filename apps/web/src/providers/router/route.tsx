import {
  createRoute,
  stripSearchParams
} from '@tanstack/react-router';
import type { InferFullSearchSchema } from '@tanstack/react-router';

import App from '~/app';

import { rootRoute } from '.';

import { preloadWorkDetails } from './preload';
import { RootSearchSchema, IndexSearchSchema, PlaybackSearchSchema, WorkDetailsSearchSchema, PlaylistSearchSchema } from './schemas';

import { createRandomSeed } from '~/utils';

import { INDEX_DEFAULT_SEARCH_VALUES, ROOT_DEFAULT_SEARCH_VALUES } from '@asmr-collections/shared';

export const indexRoute = createRoute({
  validateSearch: IndexSearchSchema.extend(RootSearchSchema.shape),
  getParentRoute: () => rootRoute,
  path: '/',
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
  },
  component: () => <App />
});

export type WorkDetailsSearchParams = InferFullSearchSchema<typeof workDetailsRoute>;

export const workDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-details/$id',
  staleTime: Infinity,
  loader({ params, cause }) {
    const id = params.id;
    preloadWorkDetails(id, cause);
  },
  validateSearch: WorkDetailsSearchSchema
}).lazy(() => import('~/pages/work-details').then(d => d.default));

export const settingsRoute = createRoute({
  getParentRoute: () => indexRoute,
  path: '/settings'
}).lazy(() => import('~/pages/settings').then(d => d.default));

export const playbackRoute = createRoute({
  getParentRoute: () => indexRoute,
  path: '/playback',
  validateSearch: PlaybackSearchSchema
}).lazy(() => import('~/pages/playback').then(d => d.default));

export const playlistsRoute = createRoute({
  getParentRoute: () => indexRoute,
  path: '/playlists',
  validateSearch: PlaylistSearchSchema
}).lazy(() => import('~/pages/playlists').then(d => d.default));

export const playlistRoute = createRoute({
  getParentRoute: () => indexRoute,
  path: '/playlists/$id',
  validateSearch: PlaylistSearchSchema
}).lazy(() => import('~/pages/playlists/playlist').then(d => d.default));
