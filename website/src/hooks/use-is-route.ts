import { useRouterState } from '@tanstack/react-router';
import type { RegisteredRouter } from '@tanstack/react-router';

type RouteIds = keyof RegisteredRouter['routesById'];

export function useIsRoute(id: RouteIds) {
  const router = useRouterState();
  return router.matches.some(match => match.routeId === id);
}
