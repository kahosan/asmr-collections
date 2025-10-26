import { toast } from 'sonner';
import { useState } from 'react';

import { fetcher, HTTPError } from '~/lib/fetcher';
import type { FetcherKey } from '~/types/fetcher';

export function useToastFetch() {
  const [isLoading, setIsLoading] = useState(false);

  const toastcher = <T>(
    url: FetcherKey,
    options?: RequestInit,
    data?: {
      loading?: string | React.ReactNode
      success?: string | React.ReactNode | ((data: T) => React.ReactNode | string)
      error?: string | React.ReactNode | ((error: Error) => React.ReactNode | string)
      description?: React.ReactNode | string | ((data: T) => React.ReactNode | string)
      finally?: () => void | Promise<void>
    }
  ) => {
    setIsLoading(true);
    toast.promise(fetcher<T>(url, options), {
      loading: data?.loading,
      success: data?.success,
      error(e: HTTPError) {
        if (typeof data?.error === 'function')
          return data.error(e);
        return data?.error || e.message;
      },
      description(bodyData: T) {
        if (bodyData instanceof HTTPError) {
          let text = bodyData.message;
          if (bodyData.data) {
            text += ': ';
            text += typeof bodyData.data === 'object'
              ? Object.values(bodyData.data).join(', ')
              : bodyData.data;
          }
          return text;
        }

        if (bodyData instanceof Error)
          return bodyData.message;

        if (typeof data?.description === 'function')
          return data.description(bodyData);

        return data?.description;
      },
      async finally() {
        // eslint-disable-next-line promise/valid-params -- not promise
        await data?.finally?.();
        setIsLoading(false);
      }
    });
  };

  return [isLoading, toastcher] as const;
}
