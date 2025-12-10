import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { produce } from 'immer';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useGenerateSearch } from '~/hooks/use-generate-search';

import { notifyError } from '~/utils';

import { cn } from '~/lib/utils';
import { fetcher } from '~/lib/fetcher';

import type { Data } from '@asmr-collections/shared';

export default function GenresFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/genre', fetcher, {
    onError: error => notifyError(error, '获取标签列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: number) => {
    const currentList = search.genres || [];

    const newList = produce(currentList, draft => {
      const indexSelected = draft.indexOf(id);
      const indexExcluded = draft.indexOf(-id);

      if (indexSelected !== -1)
        draft[indexSelected] = -id;
      else if (indexExcluded === -1)
        draft.push(id);
      else
        draft.splice(indexExcluded, 1);
    });

    if (newList.length === 0)
      navigate({ to: '/', search: exclude(['keyword', 'page', 'genres']) });
    else
      navigate({ to: '/', search: exclude(['keyword', 'page'], { genres: newList }) });
  }, [exclude, navigate, search.genres]);

  // 2. 获取当前状态 (True / False / 'indeterminate')
  const isChecked = ({ id }: Data<number>) => {
    if (search.genres?.includes(id)) return true;
    if (search.genres?.includes(-id)) return 'indeterminate';
    return false;
  };

  return (
    <MenubarSub>
      <MenubarSubTrigger className={cn('transition-opacity', search.genres?.length ? 'opacity-100' : 'opacity-60')}>
        标签
      </MenubarSubTrigger>
      <MenubarSubContent>
        <FilterPanel
          placeholder="筛选标签..."
          isLoading={isLoading}
          error={error}
          errorText="获取标签列表失败"
          data={data}
          handleSelect={handleSelect}
          selectedData={search.genres}
          isCheck={isChecked}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
