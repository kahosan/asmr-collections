import { MenubarCheckboxItem, MenubarSeparator, MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

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

export default function ArtistsFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/artist', fetcher, {
    onError: error => notifyError(error, '获取声优列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: number) => {
    const currentList = search.artistId || [];

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
      navigate({ to: '/', search: exclude(['keyword', 'page', 'artistId']) });
    else
      navigate({ to: '/', search: exclude(['keyword', 'page'], { artistId: newList }) });
  }, [exclude, navigate, search.artistId]);

  const isCheck = useCallback((data: Data<number>) => {
    if (search.artistId?.includes(data.id)) return true;
    if (search.artistId?.includes(-data.id)) return 'indeterminate';
    return false;
  }, [search.artistId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger className={cn('transition-opacity', search.artistId?.length ? 'opacity-100' : 'opacity-60')}>
        声优
      </MenubarSubTrigger>
      <MenubarSubContent>
        <MenubarSub>
          <MenubarSubTrigger className={cn('transition-opacity', search.artistCount ? 'opacity-100' : 'opacity-60')}>
            人数
          </MenubarSubTrigger>
          <MenubarSubContent>
            {[1, 2, 3, 4, 5, 6].map(count => (
              <MenubarCheckboxItem
                key={count}
                checked={search.artistCount === count}
                onCheckedChange={checked => {
                  if (checked)
                    navigate({ to: '/', search: exclude(['page', 'keyword'], { artistCount: count }) });
                  else
                    navigate({ to: '/', search: exclude(['page', 'keyword', 'artistCount']) });
                }}
                onSelect={e => e.preventDefault()}
              >
                {count}
              </MenubarCheckboxItem>
            ))}
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator />
        <FilterPanel
          placeholder="筛选声优..."
          isLoading={isLoading}
          error={error}
          errorText="获取声优列表失败"
          data={data}
          handleSelect={handleSelect}
          selectedData={search.artistId}
          isCheck={isCheck}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
