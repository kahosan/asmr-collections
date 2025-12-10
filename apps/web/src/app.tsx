import Works from './components/works';
import Pagination from './components/pagination';
import WorkSkeletons from './components/works/skeleton';
import PreloadNextWorks from './components/works/preload-next';

import useSWRImmutable from 'swr/immutable';
import { useSearch } from '@tanstack/react-router';
import { withQuery } from '@asmr-collections/shared';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';

import type { WorksResponse } from '@asmr-collections/shared';

export default function App() {
  const _search = useSearch({ from: '/' });

  // 确保 limit 和 page 在最后面，防止 key 变化
  const { page, limit, ...rest } = _search;
  const search = { ...rest, limit, page };

  const key = withQuery('/api/works', search);
  const nextKey = search.sort === 'random'
    ? null
    : withQuery('/api/works', { ...search, page: search.page + 1 });

  const { data, error, isLoading } = useSWRImmutable<WorksResponse>(key, fetcher, {
    onError: err => notifyError(err, '获取作品列表失败')
  });

  if (error) throw error;
  if (isLoading || !data) return <WorkSkeletons />;

  return (
    <>
      <Works data={data} />
      <Pagination total={data.total} current={search.page} limit={search.limit} />

      {/** 预渲染下一页的数据 */}
      <PreloadNextWorks swrKey={nextKey} />
    </>
  );
}
