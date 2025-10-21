import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useIndexGenerateSearch } from '~/hooks/use-generate-search';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';

import type { Data } from '~/types/work';

export default function SeriesFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<string>>>('/api/field/series', fetcher, {
    onError: error => notifyError(error, '获取系列列表失败')
  });

  const { search, exclude } = useIndexGenerateSearch();
  const navigate = useNavigate({ from: '/' });

  const handleSelect = useCallback((id: string) => {
    if (search.seriesId === id) {
      navigate({ search: exclude(['keyword', 'page', 'circleId', 'seriesId', 'artistId', 'illustratorId', 'genres', 'artistCount']) });
      return;
    }
    navigate({ search: exclude(['keyword', 'page', 'circleId', 'artistId', 'illustratorId', 'genres', 'artistCount'], { seriesId: id }) });
  }, [exclude, navigate, search.seriesId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        系列
      </MenubarSubTrigger>
      <MenubarSubContent>
        <FilterPanel
          placeholder="筛选系列..."
          isLoading={isLoading}
          error={error}
          errorText="获取系列列表失败"
          data={data}
          sort={({ id }) => (search.seriesId === id ? -1 : 0)}
          handleSelect={handleSelect}
          isCheck={({ id }) => search.seriesId === id}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
