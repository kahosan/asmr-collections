import { motion } from 'framer-motion';

import WorkCard from '../work-card';
import Pagination from '../pagination';

import useSWR from 'swr';
import { useSearch } from '@tanstack/react-router';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';

import type { WorksResponse } from '~/types/works';

export default function Works() {
  const search = useSearch({ from: '/' });
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(search))
    searchParams.set(key, value.toString());

  const { data } = useSWR<WorksResponse>(`/api/works?${searchParams.toString()}`, fetcher, {
    suspense: true,
    onError: err => notifyError(err, '获取作品列表失败')
  });

  return (
    <>
      {data?.data.length === 0 && <div className="flex justify-center opacity-70 mt-[10%]">没有更多惹...</div>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
        {data?.data.map(work => (
          <motion.div
            key={work.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <WorkCard key={work.id} work={work} />
          </motion.div>
        ))}
      </div>
      <Pagination
        total={data?.total ?? 0}
        current={Number.parseInt(searchParams.get('page') ?? '1', 10)}
      />
    </>
  );
}
