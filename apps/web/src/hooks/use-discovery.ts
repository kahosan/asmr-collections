import { useState } from 'react';

import type {
  DiscoveryItem,
  DiscoveryRequestInput,
  DiscoveryResponse
} from '@asmr-collections/shared';

import useSWRImmutable from 'swr/immutable';
import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';
import { DISCOVERY_ENDPOINT, getDiscoveryFetchOptions } from '~/lib/discovery';

export type DiscoveryKey = readonly [string, DiscoveryRequestInput];

export async function discoveryFetcher([url, request]: DiscoveryKey) {
  return fetcher<DiscoveryResponse>(url, getDiscoveryFetchOptions(request));
}

export function useDiscovery(request: DiscoveryRequestInput | null, errorText: string) {
  const key = request ? [DISCOVERY_ENDPOINT, request] as const : null;

  return useSWRImmutable<DiscoveryResponse, Error, DiscoveryKey | null>(key, discoveryFetcher, {
    onError: error => notifyError(error, errorText),
    keepPreviousData: true
  });
}

interface DiscoveryRotationState {
  rotation: number
  excludeIds: string[]
}

export function useDiscoveryRotation() {
  const [state, setState] = useState<DiscoveryRotationState>({ rotation: 0, excludeIds: [] });

  function refresh(items: DiscoveryItem[] = []) {
    setState(current => ({
      rotation: current.rotation + 1,
      excludeIds: [...new Set([...current.excludeIds, ...items.map(item => item.work.id)])].slice(-400)
    }));
  }

  function reset() {
    setState({ rotation: 0, excludeIds: [] });
  }

  return { state, refresh, reset };
}
