import { Suspense } from 'react';

import {
  RouterProvider as TanstackRouter,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter
} from '@tanstack/react-router';

import Layout from '~/layout';
import NotFound from '~/components/not-found';
import ErrorBoundary from '~/components/error-boundary';

import App from '~/app';
import WorkDetails from '~/pages/work-details';
import WorkDetailsSkeleton from '~/pages/work-details/skeleton';

import { z } from 'zod';

export const RootSearchSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
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
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  sort: z.string().optional().default('releaseDate'),
  filterOp: z.enum(['and', 'or']).optional().default('and'),
  subtitles: z.boolean().optional()
});

export type RootSearchParams = z.infer<typeof RootSearchSchema>;

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  validateSearch: RootSearchSchema
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
});

export const WorkDetailsSearchSchema = z.object({
  path: z.array(z.string()).optional()
});

export type WorkDetailsSearchParams = z.infer<typeof WorkDetailsSearchSchema>;

const workDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/work-details/$id',
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
  scrollRestoration: true
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
