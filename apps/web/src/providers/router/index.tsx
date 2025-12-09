import {
  RouterProvider as TanstackRouter,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  stripSearchParams
} from '@tanstack/react-router';
import type { InferFullSearchSchema } from '@tanstack/react-router';

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import App from '~/app';
import RootLayout from '~/layout';

import NotFound from '~/components/not-found';

import { preloadWorkDetails } from './preload';
import { RootSearchSchema, IndexSearchSchema, WorkDetailsSearchSchema } from './schemas';

import { INDEX_DEFAULT_SEARCH_VALUES, ROOT_DEFAULT_SEARCH_VALUES } from '@asmr-collections/shared';

export type RootSearchParams = InferFullSearchSchema<typeof rootRoute>;

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </RootLayout>
  ),
  validateSearch: RootSearchSchema,
  search: {
    middlewares: [stripSearchParams(ROOT_DEFAULT_SEARCH_VALUES)]
  }
});

export type IndexSearchParams = InferFullSearchSchema<typeof indexRoute>;

const indexRoute = createRoute({
  validateSearch: IndexSearchSchema,
  getParentRoute: () => rootRoute,
  path: '/',
  head: () => ({
    links: [{
      rel: 'preload',
      href: `/api/works?order=desc&sort=releaseDate&filterOp=and&page=${INDEX_DEFAULT_SEARCH_VALUES.page}&limit=${INDEX_DEFAULT_SEARCH_VALUES.limit}`,
      as: 'fetch',
      crossOrigin: 'anonymous'
    }]
  }),
  search: {
    middlewares: [stripSearchParams(INDEX_DEFAULT_SEARCH_VALUES)]
  },
  component: () => <App />
});

export type WorkDetailsSearchParams = InferFullSearchSchema<typeof workDetailsRoute>;

const workDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-details/$id',
  staleTime: Infinity,
  loader({ params, cause }) {
    const id = params.id;
    preloadWorkDetails(id, cause);
  },
  validateSearch: WorkDetailsSearchSchema
}).lazy(() => import('~/pages/work-details').then(d => d.default));

const SettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings'
}).lazy(() => import('~/pages/settings').then(d => d.default));

const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    workDetailsRoute,
    SettingsRoute
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
