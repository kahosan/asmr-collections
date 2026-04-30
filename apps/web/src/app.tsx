import { Works } from './components/works';
import { Pagination } from './components/pagination';
import { PrefetchSWR } from './components/prefetch-swr';
import { WorkSkeletons } from './components/works/skeleton';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import { withQuery } from '@asmr-collections/shared';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';
import { indexRoute } from './providers/router/route';

import type { WorksResponse } from '@asmr-collections/shared';

export default function App() {
  const _search = indexRoute.useSearch();

  // 确保 limit 和 page 在最后面，防止 key 变化
  const { page, limit, ...rest } = _search;
  const search = { ...rest, limit, page };

  const disableReMutate = search.sort === 'random';

  const key = withQuery('/api/works', search);
  const nextKey = disableReMutate
    ? null
    : withQuery('/api/works', { ...search, page: search.page + 1 });

  const { data, error, isLoading } = useSWR<WorksResponse>(key, fetcher, {
    onError: err => notifyError(err, '获取作品列表失败'),
    revalidateOnFocus: !disableReMutate,
    revalidateIfStale: !disableReMutate
  });

  if (error) throw error;
  if (isLoading || !data) return <WorkSkeletons />;

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: .2 }}
    >
      <Works data={data.data} />
      <Pagination total={data.total} current={search.page} limit={search.limit} />

      {/** 预渲染下一页的数据 */}
      <PrefetchSWR swrKey={nextKey} />
    </motion.div>
  );
}
