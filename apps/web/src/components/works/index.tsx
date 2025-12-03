import { ViewTransition } from 'react';

import WorkSkeletons from './skeleton';

import WorkCard from '../work-card';
import Pagination from '../pagination';

import useSWR from 'swr';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';

import type { WorksResponse } from '@asmr-collections/shared';

interface WorksProps {
  swrKey: string
}

export default function Works({ swrKey }: WorksProps) {
  const { data, error, isLoading } = useSWR<WorksResponse>(swrKey, fetcher, {
    onError: err => notifyError(err, '获取作品列表失败')
  });

  if (error) throw error;
  if (isLoading) {
    return (
      <ViewTransition name="works">
        <WorkSkeletons />;
      </ViewTransition>
    );
  }

  return (
    <ViewTransition name="works">
      {data?.data.length === 0 && <div className="flex justify-center opacity-70 mt-[10%]">没有更多惹...</div>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
        {data?.data.map(work => (
          <div key={work.id}>
            <WorkCard key={work.id} work={work} />
          </div>
        ))}
      </div>
      <Pagination total={data?.total ?? 0} />
    </ViewTransition>
  );
}
