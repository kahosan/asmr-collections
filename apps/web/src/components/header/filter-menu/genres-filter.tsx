import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useGenerateSearch } from '~/hooks/use-generate-search';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';

import type { Data } from '~/types/work';

export default function GenresFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/genre', fetcher, {
    onError: error => notifyError(error, '获取标签列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: number) => {
    if (search.genres?.includes(id)) {
      navigate({
        to: '/',
        search: exclude(['keyword', 'page'], { genres: search.genres.filter(_id => _id !== id) })
      });
      return;
    }

    navigate({
      to: '/',
      search: exclude(['keyword', 'page'], { genres: [...search.genres ?? [], id] })
    });
  }, [exclude, navigate, search.genres]);

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        标签
      </MenubarSubTrigger>
      <MenubarSubContent>
        <FilterPanel
          placeholder="筛选标签..."
          isLoading={isLoading}
          error={error}
          errorText="获取标签列表失败"
          data={data}
          sort={({ id }) => (search.genres?.includes(id) ? -1 : 1)}
          handleSelect={handleSelect}
          isCheck={({ id }) => search.genres?.includes(id) ?? false}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
