import { useCallback } from 'react';
import type { RegisteredRouter } from '@tanstack/react-router';
import { useSearch } from '@tanstack/react-router';

import type { RootSearchParams } from '~/providers/router';

type RootSearchParamsKeys = keyof RootSearchParams;

type IncludeContain<I extends RootSearchParamsKeys> = { [Key in Exclude<RootSearchParamsKeys, I>]?: RootSearchParams[Key] };
type IncludeReturn<I extends RootSearchParamsKeys> = { [Key in I]: RootSearchParams[Key] };

type ExcludeContain<E extends RootSearchParamsKeys> = IncludeContain<E>;
type ExcludeReturn<E extends RootSearchParamsKeys> = { [Key in Exclude<RootSearchParamsKeys, E>]: RootSearchParams[Key] };

type RouteIds = keyof RegisteredRouter['routesById'];

/**
 * 生成搜索参数的自定义 Hook
 * 用于在路由跳转时生成新的搜索参数，支持包含或排除特定参数
 *
 * @param from - 路由 ID
 * @default '__root__'
 * @returns 返回包含当前搜索参数和两个生成方法的对象
 */
export function useIndexGenerateSearch(from: RouteIds = '__root__') {
  const search = useSearch({ from });

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
    <I extends RootSearchParamsKeys>(
      params: I[],
      contain?: IncludeContain<I>
    ): IncludeReturn<I> => {
      // 初始化默认搜索参数
      const _params: RootSearchParams = {
        sort: 'releaseDate',
        order: 'desc',
        filterOp: 'and'
      };

      // 从当前搜索参数中提取指定的参数
      for (const key of params) {
        if (!search[key]) continue;
        _params[key] = search[key];
      }

      // 添加额外的参数
      if (contain) {
        for (const [key, value] of Object.entries(contain)) {
          if (!value) continue;
          _params[key as keyof IncludeContain<I>] = value as RootSearchParams[keyof IncludeContain<I>];
        }
      }

      return _params;
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
    <E extends RootSearchParamsKeys>(
      params: E[],
      contain?: ExcludeContain<E>
    ): ExcludeReturn<E> => {
      // 初始化默认搜索参数
      const _params: RootSearchParams = {
        sort: 'releaseDate',
        order: 'desc',
        filterOp: 'and'
      };

      // 保留除了指定参数外的所有参数
      for (const key in search) {
        if (!search[key as E]) continue;
        if (Object.hasOwn(search, key)) {
          const _key = key as E;
          // 如果当前键不在排除列表中，则保留
          if (!params.includes(_key))
            _params[_key] = search[_key];
        }
      }

      // 添加额外的参数
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
