import { useCallback } from 'react';
import type { ToastT } from 'sonner';
import { toast } from 'sonner';

import useSWRMutation from 'swr/mutation';

import { fetcher, HTTPError } from '~/lib/fetcher';
import type { FetcherKey } from '~/types/fetcher';

interface Arg {
  key: FetcherKey
  fetchOps?: RequestInit
}

interface ToastOps<T> {
  loading?: string | React.ReactNode
  success?: string | React.ReactNode | ((data: T) => React.ReactNode | string)
  error?: string | React.ReactNode | ((error: Error) => React.ReactNode | string)
  description?: React.ReactNode | string | ((data: T) => React.ReactNode | string)
  position?: ToastT['position']
  finally?: () => void | Promise<void>
}

interface ToastcherOptions<T> {
  key: FetcherKey
  /**
   * Fetch options for the request
   */
  fetchOps?: RequestInit
  /**
   * Toast options
   */
  toastOps?: ToastOps<T>
}

type ToastMutationKeys =
  | 'delete'
  | 'create'
  | 'refresh'
  | 'upload'
  | 'subtitles'
  | `clear-${string}-cache`;

export function useToastMutation<T>(key: ToastMutationKeys) {
  const { trigger, isMutating, ...rest } = useSWRMutation(
    key,
    (_: ToastMutationKeys, { arg }: { arg: Arg }) => fetcher<T>(arg.key, arg.fetchOps)
  );

  const toastcher = useCallback(({
    key,
    fetchOps,
    toastOps
  }: ToastcherOptions<T>) => toast.promise(trigger({ key, fetchOps }), {
    ...toastOps,
    loading: toastOps?.loading,
    success: toastOps?.success,
    error: toastOps?.error,
    description(data: T) {
      if (data instanceof HTTPError) {
        let text = data.message;
        if (data.data) {
          text += ': ';
          text += typeof data.data === 'object'
            ? Object.values(data.data).join(', ')
            : data.data;
        }
        return text;
      }

      if (data instanceof Error)
        return data.message;

      if (typeof toastOps?.description === 'function')
        return toastOps.description(data);

      return toastOps?.description;
    },
    async finally() {
      // eslint-disable-next-line promise/valid-params -- not promise
      await toastOps?.finally?.();
    }
  }), [trigger]);

  return [toastcher, isMutating, rest] as const;
}
