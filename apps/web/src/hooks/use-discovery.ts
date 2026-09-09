import { unstable_serialize } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useCallback, useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import { settingOptionsAtom } from './use-setting-options';

import type {
  DiscoveryProvider,
  DiscoveryRequestInput,
  DiscoveryResponse,
  DLsiteRankPeriod
} from '@asmr-collections/shared';

import { DEFAULT_DLSITE_RANK_PERIOD } from '@asmr-collections/shared';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';
import { createDiscoveryRequest, DISCOVERY_ENDPOINT, getDiscoveryDate, getDiscoveryFetchOptions } from '~/lib/discovery';

import type { DiscoverySelection } from '~/lib/discovery';

export type DiscoveryKey = readonly [string, DiscoveryRequestInput];
export type DiscoveryView = 'personal' | DiscoveryProvider;

export const discoveryViewAtom = atom<DiscoveryView>('dlsite');
export const discoveryPeriodAtom = atom<DLsiteRankPeriod>(DEFAULT_DLSITE_RANK_PERIOD);

interface DiscoveryHistoryEntry {
  request: DiscoveryRequestInput
  response: DiscoveryResponse
}

interface DiscoveryHistory {
  entries: DiscoveryHistoryEntry[]
  index: number
  pending: DiscoveryRequestInput | null
  exhausted: boolean
}

export interface DiscoveryNavigation {
  page: number
  hasPrevious: boolean
  hasNext: boolean
  isLoading: boolean
  previous: () => void
  next: () => void
}

const EMPTY_HISTORY: DiscoveryHistory = {
  entries: [], index: 0, pending: null, exhausted: false
};

// Plain atoms and the session date survive route changes and reset on reload.
const discoveryHistoriesAtom = atom<Partial<Record<string, DiscoveryHistory>>>({});
const sessionDate = getDiscoveryDate();

function getRequestKey(request: DiscoveryRequestInput) {
  return unstable_serialize([DISCOVERY_ENDPOINT, request]);
}

export async function discoveryFetcher([url, request]: DiscoveryKey) {
  return fetcher<DiscoveryResponse>(url, getDiscoveryFetchOptions(request));
}

export function useDiscoveryRotation(selection: Exclude<DiscoverySelection, { scene: 'random' }>, errorText: string) {
  const options = useAtomValue(settingOptionsAtom);
  const histories = useAtomValue(discoveryHistoriesAtom);
  const setHistories = useSetAtom(discoveryHistoriesAtom);
  const initialRequest = createDiscoveryRequest(options, { ...selection, date: sessionDate });
  // Scene, provider, period, count and rules are part of the key, so histories
  // never share a cursor or exclusion list.
  const historyKey = getRequestKey(initialRequest);
  const history = histories[historyKey] ?? EMPTY_HISTORY;
  const entry = history.entries.at(history.index);
  const request = history.pending ?? entry?.request ?? initialRequest;
  const requestKey = getRequestKey(request);

  const updateHistory = useCallback((updater: (current: DiscoveryHistory) => DiscoveryHistory) => {
    setHistories(current => {
      const previous = current[historyKey] ?? EMPTY_HISTORY;
      const next = updater(previous);
      return next === previous ? current : { ...current, [historyKey]: next };
    });
  }, [historyKey, setHistories]);

  const snapshot = history.pending ? undefined : entry?.response;
  const { data, error, isLoading, isValidating, mutate } = useSWRImmutable<DiscoveryResponse, Error, DiscoveryKey>(
    [DISCOVERY_ENDPOINT, request], discoveryFetcher, {
      onError(error) {
        notifyError(error, errorText);
        // Only a completed failure rolls back the pending request. A cached
        // error from an earlier attempt must not cancel a new retry.
        updateHistory(current => {
          if (!current.pending || getRequestKey(current.pending) !== requestKey) return current;
          return { ...current, pending: null };
        });
      },
      fallbackData: snapshot,
      revalidateOnMount: snapshot ? false : undefined,
      shouldRetryOnError: false
    }
  );

  useEffect(() => {
    if (isValidating || error || !data) return;

    updateHistory(current => {
      const currentEntry = current.entries.at(current.index);
      const activeRequest = current.pending ?? currentEntry?.request;
      if (activeRequest && getRequestKey(activeRequest) !== requestKey) return current;

      if (current.pending || !currentEntry) {
        if (data.data.length === 0 && currentEntry)
          return { ...current, pending: null, exhausted: true };

        return {
          entries: [...current.entries, { request, response: data }],
          index: current.entries.length,
          pending: null,
          exhausted: data.data.length === 0
        };
      }

      if (currentEntry.response === data) return current;
      // Explicit mutations after adding or deleting a work update the current
      // snapshot in place in history, without creating another batch.
      return {
        ...current,
        entries: current.entries.with(current.index, { ...currentEntry, response: data }),
        exhausted: data.data.length === 0
      };
    });
  }, [data, error, isValidating, request, requestKey, updateHistory]);

  const isFetching = Boolean(history.pending) || isLoading || isValidating;

  function previous() {
    if (isFetching) return;
    updateHistory(current => {
      if (current.index === 0 || current.pending) return current;
      return { ...current, index: current.index - 1 };
    });
  }

  function next() {
    if (isFetching) return;
    if (!entry) {
      mutate();
      return;
    }

    updateHistory(current => {
      if (current.pending) return current;
      if (current.index < current.entries.length - 1)
        return { ...current, index: current.index + 1 };
      if (current.exhausted) return current;

      const ids = current.entries.flatMap(historyEntry => historyEntry.response.data.map(item => item.work.id));
      const excludeIds = [...new Set(ids.map(id => id.toUpperCase()))].slice(-400);
      return {
        ...current,
        pending: createDiscoveryRequest(options, {
          ...selection,
          date: sessionDate,
          rotation: current.entries.length,
          excludeIds
        })
      };
    });
  }

  const navigation: DiscoveryNavigation = {
    page: history.index + 1,
    hasPrevious: history.index > 0,
    hasNext: history.index < history.entries.length - 1 || !history.exhausted,
    isLoading: isFetching,
    previous,
    next
  };

  return {
    data: entry?.response,
    error: entry ? undefined : error,
    isLoading: !entry && (isLoading || isValidating),
    navigation,
    mutate
  };
}
