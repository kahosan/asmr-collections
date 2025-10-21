import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useIndexGenerateSearch } from '~/hooks/use-generate-search';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';

import type { Data } from '~/types/work';

export default function IllustratorsFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/illustrator', fetcher, {
    onError: error => notifyError(error, '获取画师列表失败')
  });

  const { search, exclude } = useIndexGenerateSearch();
  const navigate = useNavigate({ from: '/' });

  const handleSelect = useCallback((id: number) => {
    if (search.illustratorId === id) {
      navigate({ search: exclude(['keyword', 'page', 'illustratorId', 'seriesId']) });
      return;
    }
    navigate({ search: exclude(['keyword', 'page', 'seriesId'], { illustratorId: id }) });
  }, [exclude, navigate, search.illustratorId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        画师
      </MenubarSubTrigger>
      <MenubarSubContent>
        <FilterPanel
          placeholder="筛选画师..."
          isLoading={isLoading}
          error={error}
          errorText="获取画师列表失败"
          data={data}
          sort={({ id }) => (search.illustratorId === id ? -1 : 1)}
          handleSelect={handleSelect}
          isCheck={({ id }) => search.illustratorId === id}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
