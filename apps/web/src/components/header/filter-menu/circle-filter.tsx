import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useGenerateSearch } from '~/hooks/use-generate-search';

import { notifyError } from '~/utils';

import { cn } from '~/lib/utils';
import { fetcher } from '~/lib/fetcher';

import type { Data } from '~/types/work';

export default function CircleFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<string>>>('/api/field/circle', fetcher, {
    onError: error => notifyError(error, '获取社团列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: string) => {
    if (search.circleId === id) {
      navigate({ to: '/', search: exclude(['keyword', 'page', 'circleId']) });
      return;
    }

    navigate({ to: '/', search: exclude(['keyword', 'page'], { circleId: id }) });
  }, [exclude, navigate, search.circleId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger className={cn('transition-opacity', search.circleId ? 'opacity-100' : 'opacity-60')}>
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
