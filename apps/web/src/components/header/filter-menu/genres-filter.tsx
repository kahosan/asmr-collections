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

export default function GenresFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<number>>>('/api/field/genre', fetcher, {
    onError: error => notifyError(error, '获取标签列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: number) => {
    const currentList = search.genres || [];
    const isSelected = currentList.includes(id);
    const isExcluded = currentList.includes(-id);

    let newList: number[];

    if (isSelected) {
      // 当前是“选中” -> 切换为“排除” (移除正数，添加负数)
      newList = currentList.filter(x => x !== id).concat(-id);
    } else if (isExcluded) {
      // 当前是“排除” -> 切换为“未选中” (移除负数)
      newList = currentList.filter(x => x !== -id);
    } else {
      // 当前是“未选中” -> 切换为“选中” (添加正数)
      newList = [...currentList, id];
    }

    // 更新 URL，如果数组为空则移除字段
    if (newList.length === 0)
      navigate({ to: '/', search: exclude(['keyword', 'page', 'genres']) });
    else
      navigate({ to: '/', search: exclude(['keyword', 'page'], { genres: newList }) });
  }, [exclude, navigate, search.genres]);

  const sortFn = useCallback(({ id }: Data<number>) => {
    if (search.genres?.includes(id)) return -2;
    if (search.genres?.includes(-id)) return -1;
    return 0;
  }, [search.genres]);

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
          sort={sortFn}
          handleSelect={handleSelect}
          isCheck={isChecked}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
