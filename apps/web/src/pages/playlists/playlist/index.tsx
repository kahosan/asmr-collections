import { Works } from '~/components/works';
import { Pagination } from '~/components/pagination';
import { PrefetchSWR } from '~/components/prefetch-swr';
import { ButtonGroup } from '~/components/ui/button-group';
import { ErrorBoundary } from '~/components/error-boundary';

import { PlaylistSkeleton } from '../components/skeleton';
import { PlaylistDialog } from '../components/playlist-dialog';
import { PlaylistDelete } from '../components/playlist-delete';

import useSWR from 'swr';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { createLazyRoute } from '@tanstack/react-router';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';
import { withQuery } from '@asmr-collections/shared';
import { playlistRoute } from '~/providers/router/route';

import type { PlaylistResponse } from '@asmr-collections/shared';

const { useSearch, useParams } = playlistRoute;

function Playlist() {
  const { id } = useParams();
  const { page, limit } = useSearch();

  const swrKey = withQuery(`/api/playlist/${id}`, {
    page,
    limit
  });

  const nextSWRKey = withQuery(`/api/playlist/${id}`, {
    page: page + 1,
    limit
  });

  const { data } = useSWR<PlaylistResponse>(swrKey, fetcher, {
    onError: e => notifyError(e, '获取播放列表失败'),
    suspense: true
  });

  if (!data)
    throw new Error('播放列表不存在');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-medium wrap-break-word line-clamp-2">{data.data.name}</h2>
          <div className="flex items-center gap-4">
            <ButtonGroup>
              <PlaylistDialog type="edit" playlist={data.data} />
              <PlaylistDelete id={id} />
            </ButtonGroup>
          </div>
        </div>
        {data.data.description && <p className="text-muted-foreground text-sm wrap-break-word p-2.5 bg-card rounded-md">{data.data.description}</p>}
      </div>
      <Works data={data.data.works} className="grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]" />
      <Pagination total={data.total} current={page} limit={limit} />
      <PrefetchSWR swrKey={nextSWRKey} />
    </motion.div>
  );
}

function PlaylistWrapper() {
  const { id } = useParams();

  return (
    <ErrorBoundary key={id}>
      <div className="max-w-7xl mx-auto mt-4">
        <Suspense fallback={<PlaylistSkeleton />}>
          <Playlist />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

const Route = createLazyRoute('/playlists/$id')({
  component: PlaylistWrapper
});

export default Route;
