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

export default function CircleFilter() {
  const { data, isLoading, error } = useSWR<Array<Data<string>>>('/api/field/circle', fetcher, {
    onError: error => notifyError(error, '获取社团列表失败')
  });

  const { search, exclude } = useGenerateSearch();
  const navigate = useNavigate();

  const handleSelect = useCallback((id: string) => {
    const excludedId = `-${id}`;

    if (search.circleId === id) {
      // 当前是“选中” -> 切换为“排除”
      navigate({
        to: '/',
        search: exclude(['keyword', 'page'], { circleId: excludedId })
      });
    } else if (search.circleId === excludedId) {
      // 当前是“排除” -> 切换为“未选中” (移除 circleId 字段)
      navigate({
        to: '/',
        search: exclude(['keyword', 'page', 'circleId'])
      });
    } else {
      // 当前是“未选中”或其他 -> 切换为“选中”
      navigate({
        to: '/',
        search: exclude(['keyword', 'page'], { circleId: id })
      });
    }
  }, [exclude, navigate, search.circleId]);

  const isCheck = ({ id }: Data<string>) => {
    if (search.circleId === id) return true;
    if (search.circleId === `-${id}`) return 'indeterminate'; // 字符串加前缀判断
    return false;
  };

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
          handleSelect={handleSelect}
          selectedData={search.circleId}
          isCheck={isCheck}
        />
      </MenubarSubContent>
    </MenubarSub>
  );
}
