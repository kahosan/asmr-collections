import { useRouterState } from '@tanstack/react-router';
import type { RegisteredRouter } from '@tanstack/react-router';

type RouteIds = keyof RegisteredRouter['routesById'];

export function useIsRoute(id: RouteIds) {
  return useRouterState({
    select: state => state.matches.some(match => match.routeId === id)
  });
}
