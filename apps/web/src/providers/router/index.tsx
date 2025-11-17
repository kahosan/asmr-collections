import { Suspense } from 'react';

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

import Layout from '~/layout';
import NotFound from '~/components/not-found';
import ErrorBoundary from '~/components/error-boundary';

import App from '~/app';
import WorkDetails from '~/pages/work-details';
import WorkDetailsSkeleton from '~/pages/work-details/skeleton';

import { preloadWorkDetails } from './preload';
import { RootSearchSchema, IndexSearchSchema, WorkDetailsSearchSchema } from './schemas';

import { ROOT_DEFAULT_SEARCH_VALUES } from './constants';

export type RootSearchParams = InferFullSearchSchema<typeof rootRoute>;

const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <Layout>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </Layout>
    </ErrorBoundary>
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
      href: '/api/works?order=desc&sort=releaseDate&filterOp=and',
      as: 'fetch',
      crossOrigin: 'anonymous'
    }]
  }),
  component: () => (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
});

export type WorkDetailsSearchParams = InferFullSearchSchema<typeof workDetailsRoute>;

const workDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-details/$id',
  loader({ params }) {
    const id = params.id;
    preloadWorkDetails(id);
  },
  component() {
    const id = workDetailsRoute.useParams().id;
    return (
      <ErrorBoundary key={id}>
        <Suspense fallback={<WorkDetailsSkeleton />}>
          <WorkDetails />
        </Suspense>
      </ErrorBoundary>
    );
  },
  validateSearch: WorkDetailsSearchSchema
});

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, workDetailsRoute]),
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
