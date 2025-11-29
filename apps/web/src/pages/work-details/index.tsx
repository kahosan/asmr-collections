import { getRouteApi, Link, useMatchRoute } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { Activity, useCallback } from 'react';

import { formatChineseDate } from '@asmr-collections/shared';

import { ImageIcon, MicIcon } from 'lucide-react';

import WorkPreview from '~/components/work-preview';

import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';

import SimilarWorks from './similar';
import TracksTabale from './tracks-table';
import TracksSkeleton from './tracks-skeleton';

import { useAtomValue } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { useWorkDetailsTracks } from '~/hooks/use-work-details';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import { writeClipboard } from '~/utils';

import { cn } from '~/lib/utils';
import { fetcher } from '~/lib/fetcher';

import type { Work } from '@asmr-collections/shared';

const route = getRouteApi('/work-details/$id');

export default function WorkDetails() {
  const { id } = route.useParams();
  const navigate = route.useNavigate();
  const searchPath = route.useSearch({ select: ({ path }) => path });
  const matchRoute = useMatchRoute();

  const isHiddenImage = useAtomValue(hiddenImageAtom);
  const settings = useAtomValue(settingOptionsAtom);

  const { data } = useSWRImmutable<Work>(
    `work-info-${id}`,
    fetcher,
    { suspense: true }
  );

  const smartNavigate = useCallback((path: string[]) => {
    // 当不处于 work-details 路由时，不进行导航
    if (!matchRoute({ to: '/work-details/$id' })) return;

    navigate({ params: { id }, search: { path }, replace: true });
  }, [id, matchRoute, navigate]);

  const { data: tracks, isLoading } = useWorkDetailsTracks(id, smartNavigate, data?.subtitles, searchPath);

  if (!data)
    throw new Error('作品数据请求失败，详情请查看控制台');

  return (
    <>
      <Activity mode={settings.showWorkDetail ? 'visible' : 'hidden'}>
        <Card className="md:flex-row flex-col gap-1 p-0 overflow-hidden">
          <div className="w-full relative md:max-w-[40%] min-w-[40%] h-auto flex items-center">
            <div className="pb-[75%]" />
            <div className="bg-zinc-700 absolute inset-0 overflow-hidden">
              <img
                src={data.cover}
                alt={data.name}
                onLoad={e => { e.currentTarget.style.opacity = '1'; }}
                className={cn(
                  'object-cover object-center size-full opacity-0 transition-opacity',
                  isHiddenImage && 'filter blur-xl'
                )}
              />
              <Badge
                className="absolute top-2 left-2 bg-[#795548] dark:text-white font-bold shadow-md cursor-copy"
                onClick={() => {
                  writeClipboard(data.id, 'ID 已复制到剪贴板');
                }}
              >
                {data.id}
                {data.subtitles ? <span>带字幕</span> : null}
                {data.exists === false ? <span>未收藏</span> : null}
              </Badge>
              {tracks?.existsInLocal === false && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'truncate block',
                    'p-2 py-1 absolute bottom-0 right-0 bg-zinc-800/80 rounded-none rounded-tl-md text-sm',
                    'text-gray-300 max-w-[70%] truncate'
                  )}
                >
                  不存在于本地库
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 p-2 w-full">
            <h2 className="sm:text-xl text-[20px] pt-2" title={data.name}>{data.name}</h2>
            <div className="opacity-70">
              <Link to="/" search={{ circleId: data.circleId }}>{data.circle.name}</Link>
              {data.seriesId ? <Link to="/" search={{ seriesId: data.seriesId }} className="ml-2">「{data.series?.name}」系列</Link> : null}
            </div>

            <Separator />

            <div className="text-sm">
              <span className="font-bold">销量：</span>
              <span>{data.sales}</span>
            </div>

            <div className="text-sm">
              <span className="font-bold">价格：</span>
              <span>{data.price}<sup className="ml-1">JPY</sup></span>
            </div>

            <div className="text-sm mb-2">
              <span className="font-bold">发行日期：</span>
              <span>{formatChineseDate(data.releaseDate)}</span>
            </div>

            <div className="text-sm inline-flex items-center flex-wrap gap-2">
              {
                data.artists.map(artist => (
                  <Button
                    key={artist.name}
                    asChild
                    variant="green"
                    size="sm"
                    disabled={!artist.id}
                  >
                    <Link to="/" search={{ artistId: [artist.id] }}>
                      <MicIcon />
                      {artist.name}
                    </Link>
                  </Button>
                ))
              }
              {
                data.illustrators.map(illust => (
                  <Button
                    key={illust.name}
                    asChild
                    variant="blue"
                    size="sm"
                    disabled={!illust.id}
                  >
                    <Link to="/" search={{ illustratorId: illust.id }}>
                      <ImageIcon />
                      {illust.name}
                    </Link>
                  </Button>
                ))
              }
            </div>

            <Separator className="opacity-0" />

            <div className="inline-flex flex-wrap gap-2 mt-auto">
              {
                data.genres.map(genre => (
                  <Link
                    key={genre.id}
                    to="/"
                    search={{ genres: [genre.id] }}
                    className="text-sm p-1 px-2 bg-zinc-200 dark:bg-zinc-700 rounded-md hover:opacity-80 transition-opacity"
                  >
                    {genre.name}
                  </Link>
                ))
              }
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2 *:px-1">
              <Button asChild variant="link" size="sm" className="w-max hover:opacity-80">
                <a href={`https://www.dlsite.com/maniax/work/=/product_id/${data.id}.html`} target="_blank" rel="noreferrer noopener">
                  DLsite
                </a>
              </Button>

              <Button asChild variant="link" size="sm" className="w-max hover:opacity-80">
                <a href={`https://asmr.one/work/${data.id}`} target="_blank" rel="noreferrer noopener">
                  ASMR.ONE
                </a>
              </Button>

              {
                data.languageEditions.map(edition => (
                  edition.workId === data.id
                    ? null
                    : (
                      <Button key={edition.workId} asChild variant="link" size="sm" className="w-max hover:opacity-80">
                        <Link to="/work-details/$id" params={{ id: edition.workId }}>
                          {edition.label}
                        </Link>
                      </Button>
                    )
                ))
              }

              {
                data.translationInfo.childWorknos.map(childId => (
                  <Button key={childId} asChild variant="link" size="sm" className="w-max hover:opacity-80">
                    <Link to="/work-details/$id" params={{ id: childId }}>
                      译者版
                    </Link>
                  </Button>
                ))
              }
            </div>
          </div>
        </Card>
        <div className="bg-current/8 p-2 rounded-md text-sm my-4">
          {data.intro}
        </div>
      </Activity>

      {isLoading && <TracksSkeleton />}

      {!isLoading && tracks?.error && (
        <div className="mt-2 text-sm opacity-65">
          {tracks.error.message || '未知错误'}
        </div>
      )}

      {!isLoading && tracks === null && (
        <p className="mt-2 text-sm opacity-65">
          当前作品不在本地库中，且未启用回退 ASMR.ONE。
        </p>
      )}

      {!isLoading && tracks?.data && (
        <TracksTabale work={data} searchPath={searchPath} tracks={tracks.data} externalSubtitles={tracks.externalSubtitles} />
      )}

      {!isLoading && !tracks?.data && (
        <WorkPreview workId={data.id} originalId={data.originalId} className="block mt-4" />
      )}

      <SimilarWorks work={data} />
    </>
  );
}
