import { MenubarCheckboxItem, MenubarSeparator, MenubarSub, MenubarSubContent, MenubarSubTrigger } from '~/components/ui/menubar';

import FilterPanel from './filter-panel';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useIndexGenerateSearch } from '~/hooks/use-generate-search';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';

import type { Data } from '~/types/work';

export default function ArtistsFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/artist', fetcher, {
    onError: error => notifyError(error, '获取声优列表失败')
  });

  const { search, exclude } = useIndexGenerateSearch();
  const navigate = useNavigate({ from: '/' });

  const handleSelect = useCallback((id: number) => {
    if (search.artistId?.includes(id)) {
      navigate({ search: exclude(['keyword', 'page', 'seriesId'], { artistId: search.artistId.filter(_id => _id !== id) }) });
      return;
    }
    navigate({ search: exclude(['keyword', 'page', 'seriesId'], { artistId: [...search.artistId ?? [], id] }) });
  }, [exclude, navigate, search.artistId]);

  return (
    <MenubarSub>
      <MenubarSubTrigger>
        声优
      </MenubarSubTrigger>
      <MenubarSubContent>
        <MenubarSub>
          <MenubarSubTrigger>
            人数
          </MenubarSubTrigger>
          <MenubarSubContent>
            {[1, 2, 3, 4, 5, 6].map(count => (
              <MenubarCheckboxItem
                key={count}
                checked={search.artistCount === count}
                onCheckedChange={checked => {
                  if (checked)
                    navigate({ search: exclude(['page', 'keyword'], { artistCount: count }) });
                  else
                    navigate({ search: exclude(['page', 'keyword', 'artistCount']) });
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
          sort={({ id }) => (search.artistId?.includes(id) ? -1 : 1)}
          handleSelect={handleSelect}
          isCheck={({ id }) => search.artistId?.includes(id) ?? false}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
