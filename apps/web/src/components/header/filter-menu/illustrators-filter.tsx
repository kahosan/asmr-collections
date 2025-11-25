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

export default function IllustratorsFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/illustrator', fetcher, {
    onError: error => notifyError(error, '获取画师列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: number) => {
    if (search.illustratorId === id) {
      navigate({ to: '/', search: exclude(['keyword', 'page', 'illustratorId']) });
      return;
    }

    navigate({ to: '/', search: exclude(['keyword', 'page'], { illustratorId: id }) });
  }, [exclude, navigate, search.illustratorId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger className={cn('transition-opacity', search.illustratorId ? 'opacity-100' : 'opacity-60')}>
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
