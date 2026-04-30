import {
  RouterProvider as TanstackRouter,
  Outlet,
  createRootRoute,
  createRouter
} from '@tanstack/react-router';
import type { InferFullSearchSchema } from '@tanstack/react-router';

import { z } from 'zod';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import RootLayout from '~/layout';

import {
  indexLayoutRoute,
  indexRoute,
  workDetailsRoute,
  settingsRoute,
  playbackRoute,
  playlistsRoute,
  playlistRoute
} from './route';

import { NotFound } from '~/components/not-found';

export type RootSearchParams = InferFullSearchSchema<typeof rootRoute>;

// eslint-disable-next-line react-refresh/only-export-components -- router
export const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </RootLayout>
  ),
  validateSearch: z.object({
    keyword: z.string().optional(),
    embedding: z.string().optional()
  })
});

export type IndexSearchParams = InferFullSearchSchema<typeof indexRoute>;

const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexLayoutRoute.addChildren([
      indexRoute,
      settingsRoute,
      playbackRoute,
      playlistsRoute,
      playlistRoute
    ]),
    workDetailsRoute
  ]),
  defaultNotFoundComponent: NotFound,
  defaultPreload: 'intent',
  scrollRestoration: true,
  getScrollRestorationKey(location) {
    // work-details/$id 页面更改 path 时共享滚动位置
    return location.pathname.startsWith('/work-details/')
      ? location.pathname
      : location.state.__TSR_key!;
  }
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function RouterProvider() {
  return (
    <TanstackRouter router={router} />
  );
}
