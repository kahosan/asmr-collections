import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useGenerateSearch } from '~/hooks/use-generate-search';

import { notifyError } from '~/utils';

import { cn } from '~/lib/utils';
import { fetcher } from '~/lib/fetcher';

import type { Data } from '@asmr-collections/shared';

export default function SeriesFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<string>>>('/api/field/series', fetcher, {
    onError: error => notifyError(error, '获取系列列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: string) => {
    const excludedId = `-${id}`;

    if (search.seriesId === id) {
      // 当前是“选中” -> 切换为“排除” (带负号)
      navigate({
        to: '/',
        search: exclude(['keyword', 'page'], { seriesId: excludedId })
      });
    } else if (search.seriesId === excludedId) {
      // 当前是“排除” -> 切换为“未选中” (移除字段)
      navigate({
        to: '/',
        search: exclude(['keyword', 'page', 'seriesId'])
      });
    } else {
      // 当前是“未选中” -> 切换为“选中” (原始 ID)
      navigate({
        to: '/',
        search: exclude(['keyword', 'page'], { seriesId: id })
      });
    }
  }, [exclude, navigate, search.seriesId]);

  const isChecked = useCallback(({ id }: Data<string>) => {
    if (search.seriesId === id) return true;
    if (search.seriesId === `-${id}`) return 'indeterminate';
    return false;
  }, [search.seriesId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger className={cn('transition-opacity', search.seriesId ? 'opacity-100' : 'opacity-60')}>
        系列
      </MenubarSubTrigger>
      <MenubarSubContent>
        <FilterPanel
          placeholder="筛选系列..."
          isLoading={isLoading}
          error={error}
          errorText="获取系列列表失败"
          data={data}
          handleSelect={handleSelect}
          selectedData={search.seriesId}
          isCheck={isChecked}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
