import useSWR from 'swr';
import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createLazyRoute, useSearch } from '@tanstack/react-router';

import { ItemGroup } from '~/components/ui/item';

import { Pagination } from '~/components/pagination';
import { PlaybackItem } from './components/playback-item';
import { PlaybackSkeleton } from './components/skeleton';

import { notifyError } from '~/utils';
import { withQuery } from '@asmr-collections/shared';

import { fetcher } from '~/lib/fetcher';

import type { PlaybacksResponse } from '@asmr-collections/shared';

function Playback() {
  const search = useSearch({ from: '/playback' });
  const key = withQuery('/api/playback', {
    page: search.page,
    limit: search.limit
  });

  const { data, mutate } = useSWR<PlaybacksResponse>(key, fetcher, {
    onError: e => notifyError(e, '获取播放列表失败'),
    suspense: true
  });

  if (!data || data.data.length === 0)
    return <div className="text-center text-muted-foreground mt-[10%]">暂无播放记录</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ItemGroup>
        <AnimatePresence initial={false}>
          {data.data.map(playback => (
            <motion.div
              layout
              key={playback.work.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PlaybackItem playback={playback} mutate={mutate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </ItemGroup>
      <Pagination total={data.total} current={search.page} limit={search.limit} />
    </motion.div>
  );
}

function PlaybackSuspense() {
  return (
    <div className="max-w-4xl mx-auto mt-4">
      <h2 className="text-2xl font-medium mb-6">最近播放</h2>
      <Suspense fallback={<PlaybackSkeleton />}>
        <Playback />
      </Suspense>
    </div>
  );
}

const Route = createLazyRoute('/playback')({
  component: PlaybackSuspense
});

export default Route;
