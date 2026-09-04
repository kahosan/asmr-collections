import useSWR from 'swr';

import type {
  DiscoveryRequest,
  DiscoveryResponse,
  DiscoveryRules
} from '@asmr-collections/shared';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/utils';
import type { DiscoveryOptions } from './use-setting-options';

export type DiscoveryRequestRules = Partial<DiscoveryRules>;
export type DiscoveryKey = readonly [string, DiscoveryRequest];

export function getDiscoveryDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function getDiscoveryRules(options: DiscoveryOptions) {
  return {
    recentExcludeDays: options.recentExcludeDays,
    avoidDuplicateCircle: options.avoidDuplicateCircle,
    circleIds: options.circleIds,
    avoidDuplicateArtist: options.avoidDuplicateArtist,
    artistIds: options.artistIds,
    avoidDuplicateSeries: options.avoidDuplicateSeries,
    forceGenreSpread: options.forceGenreSpread,
    genreIds: options.genreIds,
    avoidDuplicateWorkType: options.avoidDuplicateWorkType,
    avoidDuplicateAgeCategory: options.avoidDuplicateAgeCategory,
    storageOnly: options.storageOnly
  };
}

export async function discoveryFetcher([url, request]: DiscoveryKey) {
  return fetcher<DiscoveryResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
}

export function useDiscovery(request: DiscoveryRequest | null, errorText: string) {
  const key = request ? ['/api/discover', request] as const : null;

  return useSWR<DiscoveryResponse, Error, DiscoveryKey | null>(key, discoveryFetcher, {
    onError: error => notifyError(error, errorText),
    keepPreviousData: true
  });
}
