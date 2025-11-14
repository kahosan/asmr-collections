import { useCallback } from 'react';

import { useSearch } from '@tanstack/react-router';
import type { RegisteredRouter } from '@tanstack/react-router';

type RouterById = RegisteredRouter['routesById'];
type RouteIds = keyof RouterById;

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends
  (k: infer I) => void ? I : never;

type FullSearchParams = UnionToIntersection<
  RouterById[RouteIds]['types']['fullSearchSchema']
>;

export function useGenerateSearch<TFrom extends RouteIds = '__root__'>(from?: TFrom) {
  const search = useSearch<RegisteredRouter, TFrom>({ from: from ?? '__root__' });

  type SearchParams = TFrom extends '__root__'
    ? FullSearchParams
    : RouterById[TFrom]['types']['fullSearchSchema'];

  type SearchParamsKey = keyof SearchParams;

  type IncludeContain<I extends SearchParamsKey> = { [K in Exclude<SearchParamsKey, I>]?: SearchParams[K] };
  type IncludeReturn<I extends SearchParamsKey> = { [K in I]: SearchParams[K] };

  type ExcludeContain<E extends SearchParamsKey> = IncludeContain<E>;
  type ExcludeReturn<E extends SearchParamsKey> = { [K in Exclude<SearchParamsKey, E>]: SearchParams[K] };

  /**
   * 包含模式：只保留指定的参数
   * 从当前搜索参数中提取指定的参数，并可以添加额外的参数
   *
   * @param params - 需要保留的参数键数组
   * @param contain - 额外需要添加的参数对象（可选）
   * @returns 包含指定参数的搜索参数对象
   *
   * @example
   * // 只保留 'keyword' 和 'page' 参数
   * const newSearch = include(['keyword', 'page']);
   *
   * @example
   * // 保留 'keyword' 参数，并添加新的 'sort' 参数
   * const newSearch = include(['keyword'], { sort: 'popularity' });
   */
  const include = useCallback(
    <I extends SearchParamsKey>(
      params: I[],
      contain?: IncludeContain<I>
    ): IncludeReturn<I> => {
      const result: Record<string, unknown> = {};

      // 从当前搜索参数中提取指定的参数
      for (const key of params) {
        const searchKey = key as keyof typeof search;
        if (search[searchKey] === undefined) continue;
        result[key as string] = search[searchKey];
      }

      // 添加额外的参数
      if (contain) {
        for (const [key, value] of Object.entries(contain)) {
          if (!value) continue;
          result[key] = value;
        }
      }

      return result as IncludeReturn<I>;
    }, [search]
  );

  /**
   * 排除模式：保留除了指定参数外的所有参数
   * 从当前搜索参数中移除指定的参数，保留其他所有参数，并可以添加额外的参数
   *
   * @param params - 需要排除的参数键数组
   * @param contain - 额外需要添加的参数对象（可选）
   * @returns 包含除了指定参数外的所有搜索参数对象
   *
   * @example
   * // 移除 'page' 参数，保留其他所有参数
   * const newSearch = exclude(['page']);
   *
   * @example
   * // 移除 'page' 参数，并重置 'sort' 为新值
   * const newSearch = exclude(['page'], { sort: 'popularity' });
   */
  const exclude = useCallback(
    <E extends SearchParamsKey>(
      params: E[],
      contain?: ExcludeContain<E>
    ): ExcludeReturn<E> => {
      const result: Record<string, unknown> = {};

      // 保留除了指定参数外的所有参数
      for (const key in search) {
        if (!Object.hasOwn(search, key)) continue;
        const searchKey = key as keyof typeof search;
        if (search[searchKey] === undefined) continue;
        // 如果当前键不在排除列表中，则保留
        if (!params.includes(key as any))
          result[key] = search[searchKey];
      }

      // 添加额外的参数
      if (contain) {
        for (const [key, value] of Object.entries(contain)) {
          if (!value) continue;
          result[key] = value;
        }
      }

      return result as ExcludeReturn<E>;
    }, [search]
  );

  return {
    search,
    include,
    exclude
  };
}
