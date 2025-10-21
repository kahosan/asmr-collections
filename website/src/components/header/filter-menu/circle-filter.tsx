import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useIndexGenerateSearch } from '~/hooks/use-generate-search';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';

import type { Data } from '~/types/work';

export default function CircleFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<string>>>('/api/field/circle', fetcher, {
    onError: error => notifyError(error, '获取社团列表失败')
  });

  const { search, exclude } = useIndexGenerateSearch();
  const navigate = useNavigate({ from: '/' });

  const handleSelect = useCallback((id: string) => {
    if (search.circleId === id) {
      navigate({ search: exclude(['keyword', 'page', 'seriesId', 'circleId']) });
      return;
    }
    navigate({ search: exclude(['keyword', 'page', 'seriesId'], { circleId: id }) });
  }, [exclude, navigate, search.circleId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        社团
      </MenubarSubTrigger>
      <MenubarSubContent>
        <FilterPanel
          placeholder="筛选社团..."
          isLoading={isLoading}
          error={error}
          errorText="获取社团列表失败"
          data={data}
          sort={({ id }) => (search.circleId === id ? -1 : 0)}
          handleSelect={handleSelect}
          isCheck={({ id }) => search.circleId === id}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
