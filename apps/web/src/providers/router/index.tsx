import { Suspense } from 'react';

import {
  RouterProvider as TanstackRouter,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter
} from '@tanstack/react-router';
import type { InferFullSearchSchema } from '@tanstack/react-router';

import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import Layout from '~/layout';
import NotFound from '~/components/not-found';
import ErrorBoundary from '~/components/error-boundary';

import App from '~/app';
import WorkDetails from '~/pages/work-details';
import WorkDetailsSkeleton from '~/pages/work-details/skeleton';

import { z } from 'zod';

import { preloadWorkDetails } from './preload';

import { getStoredValue } from './utils';

export type RootSearchParams = InferFullSearchSchema<typeof rootRoute>;
export const RootSearchSchema = z.object({
  circleId: z.string().optional(),
  seriesId: z.string().optional(),
  illustratorId: z.number().optional(),
  artistId: z.array(z.number()).optional(),
  artistCount: z.number().optional(),
  genres: z.array(z.number()).optional(),
  keyword: z.string().optional(),
  embedding: z.string().optional(),
  multilingual: z.boolean().optional(),
  age: z.number().optional(),
  subtitles: z.boolean().optional(),
  existsLocal: z.enum(['only', 'exclude']).optional(),

  order: z.enum(['asc', 'desc'])
    .default(() => getStoredValue('__sort-options__')?.order ?? 'desc'),
  sort: z.string()
    .default(() => getStoredValue('__sort-options__')?.sortBy ?? 'releaseDate'),
  filterOp: z.enum(['and', 'or'])
    .default('and')
});

const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <Layout>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </Layout>
    </ErrorBoundary>
  ),
  validateSearch: RootSearchSchema
});

export type IndexSearchParams = InferFullSearchSchema<typeof indexRoute>;
export const IndexSearchSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional()
});

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
export const WorkDetailsSearchSchema = z.object({
  path: z.array(z.string()).optional()
});

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
