import { ItemGroup } from '~/components/ui/item';
import { Pagination } from '~/components/pagination';
import { PrefetchSWR } from '~/components/prefetch-swr';
import { PlaylistsSkeleton } from './components/skeleton';
import { PlaylistItem } from './components/playlist-item';
import { PlaylistDialog } from './components/playlist-dialog';

import useSWR from 'swr';
import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createLazyRoute } from '@tanstack/react-router';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';
import { playlistsRoute } from '~/providers/router/route';

import { withQuery } from '@asmr-collections/shared';

import type { PlaylistsResponse } from '@asmr-collections/shared';

function Playlists() {
  const search = playlistsRoute.useSearch();

  const swrKey = withQuery('/api/playlist', {
    page: search.page,
    limit: search.limit
  });

  const nextSWRKey = withQuery('/api/playlist', {
    page: search.page + 1,
    limit: search.limit
  });

  const { data } = useSWR<PlaylistsResponse>(swrKey, fetcher, {
    onError: e => notifyError(e, '获取播放列表失败'),
    suspense: true
  });

  if (!data || data.data.length === 0)
    return <div className="text-center text-muted-foreground mt-[10%]">暂无播放列表</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ItemGroup className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-6">
        <AnimatePresence key={search.page}>
          {data.data.map(playlist => (
            <motion.div
              layout
              key={playlist.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PlaylistItem playlist={playlist} />
            </motion.div>
          ))}
        </AnimatePresence>
      </ItemGroup>
      <Pagination total={data.total} current={search.page} limit={search.limit} />
      <PrefetchSWR swrKey={nextSWRKey} />
    </motion.div>
  );
}

function PlaylistsWrapper() {
  return (
    <div className="max-w-4xl mx-auto mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">播放列表</h2>
        <PlaylistDialog type="create" />
      </div>
      <Suspense fallback={<PlaylistsSkeleton />}>
        <Playlists />
      </Suspense>
    </div>
  );
}

const Route = createLazyRoute('/app/playlists')({
  component: PlaylistsWrapper
});

export default Route;
