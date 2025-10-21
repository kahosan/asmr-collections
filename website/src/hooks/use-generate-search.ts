import { useCallback } from 'react';
import { useSearch } from '@tanstack/react-router';

import type { RootSearchParams } from '~/providers/router';

type RootSearchParamsKeys = keyof RootSearchParams;

type IncludeContain<I extends RootSearchParamsKeys> = { [Key in Exclude<RootSearchParamsKeys, I>]?: RootSearchParams[Key] };
type IncludeReturn<I extends RootSearchParamsKeys> = { [Key in I]: RootSearchParams[Key] };

type ExcludeContain<E extends RootSearchParamsKeys> = IncludeContain<E>;
type ExcludeReturn<E extends RootSearchParamsKeys> = { [Key in Exclude<RootSearchParamsKeys, E>]: RootSearchParams[Key] };

export function useIndexGenerateSearch(from: '__root__' | '/' | '/work-details/$id' = '/') {
  const search = useSearch({ from });

  const include = useCallback(
    <I extends RootSearchParamsKeys>(
      params: I[],
      contain?: IncludeContain<I>
    ): IncludeReturn<I> => {
      const _params: RootSearchParams = {
        sort: 'releaseDate',
        order: 'desc',
        filterOp: 'and'
      };

      for (const key of params) {
        if (!search[key]) continue;
        _params[key] = search[key];
      }

      if (contain) {
        for (const [key, value] of Object.entries(contain)) {
          if (!value) continue;
          _params[key as keyof IncludeContain<I>] = value as RootSearchParams[keyof IncludeContain<I>];
        }
      }

      return _params;
    }, [search]
  );

  const exclude = useCallback(
    <E extends RootSearchParamsKeys>(
      params: E[],
      contain?: ExcludeContain<E>
    ): ExcludeReturn<E> => {
      const _params: RootSearchParams = {
        sort: 'releaseDate',
        order: 'desc',
        filterOp: 'and'
      };

      for (const key in search) {
        if (!search[key as E]) continue;
        if (Object.hasOwn(search, key)) {
          const _key = key as E;
          if (!params.includes(_key))
            _params[_key] = search[_key];
        }
      }

      if (contain) {
        for (const [key, value] of Object.entries(contain)) {
          if (!value) continue;
          _params[key as keyof ExcludeContain<E>] = value as RootSearchParams[keyof ExcludeContain<E>];
        }
      }

      return _params;
    }, [search]
  );

  return {
    search,
    include,
    exclude
  };
}
