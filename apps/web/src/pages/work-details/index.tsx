import { createLazyRoute, getRouteApi, useMatchRoute } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { Activity, Suspense, useCallback } from 'react';

import { formatChineseDate } from '@asmr-collections/shared';

import { ImageIcon, MicIcon, TagIcon } from 'lucide-react';

import { Link } from '~/components/link';
import { Image } from '~/components/image';
import { WorkPreview } from '~/components/work-preview';

import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';

import { SimilarWorks } from './components/similar';
import { MetaButton } from '~/components/meta-button';
import { TracksTabale } from './components/tracks-table';
import { ErrorBoundary } from '~/components/error-boundary';
import { WorkDetailsSkeleton } from './components/skeleton';
import { TracksSkeleton } from './components/tracks-skeleton';

import { match } from 'ts-pattern';
import { useAtomValue } from 'jotai';

import { useWorkInfo } from '~/hooks/use-work-info';
import { useWorkDetailsTracks } from '~/hooks/use-work-details';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import { externalUrl, writeClipboard } from '~/utils';

import { cn } from '~/lib/utils';

const route = getRouteApi('/work-details/$id');

function WorkDetails({ id}: { id: string }) {
  const navigate = route.useNavigate();
  const searchPath = route.useSearch({ select: ({ path }) => path });
  const matchRoute = useMatchRoute();

  const settings = useAtomValue(settingOptionsAtom);

  const { data } = useWorkInfo(id, { suspense: true });

  const smartNavigate = useCallback((path: string[]) => {
    // 当不处于 work-details 路由时，不进行导航
    if (!matchRoute({ to: '/work-details/$id' })) return;

    navigate({ params: { id }, search: { path }, replace: true });
  }, [id, matchRoute, navigate]);

  const { data: tracks, isLoading } = useWorkDetailsTracks(id, smartNavigate, data?.subtitles, searchPath);

  if (!data)
    throw new Error('作品数据请求失败，详情请查看控制台');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Activity mode={settings.showWorkDetail ? 'visible' : 'hidden'}>
        <Card className="md:flex-row flex-col gap-1 p-0 overflow-hidden">
          <div className="w-full relative md:max-w-[40%] min-w-[40%] h-auto flex items-center">
            <div className="pb-[75%]" />
            <Image
              src={data.cover}
              alt={data.name}
              classNames={{
                wrapper: 'absolute inset-0 overflow-hidden'
              }}
            />
            <Badge
              className="absolute top-2 left-2 bg-[#795548] text-white font-bold shadow-md cursor-copy"
              onClick={() => {
                writeClipboard(data.id, 'ID 已复制到剪贴板');
              }}
            >
              {data.id}
              {data.subtitles ? <span>带字幕</span> : null}
              {data.exists === false ? <span>未收藏</span> : null}
            </Badge>
            <Badge
              className={cn(
                'absolute top-10 left-2 text-white shadow-md font-bold',
                match(data.ageCategory)
                  .with(3, () => 'bg-red-500')
                  .with(2, () => 'bg-blue-500')
                  .otherwise(() => 'bg-emerald-500')
              )}
            >
              {
                match(data.ageCategory)
                  .with(1, () => '全年龄')
                  .with(2, () => 'R15')
                  .otherwise(() => 'R18')
              }
            </Badge>
            {tracks?.trackStorage && (
              <Badge className="absolute top-2 right-2 shadow-md font-bold text-white bg-[#616f6e] dark:bg-[#6b7268]" asChild>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {tracks.trackStorage.name}
                </motion.span>
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-3 p-2 w-full">
            <h2 className="sm:text-xl text-[20px] pt-2" title={data.name}>{data.name}</h2>
            <div className="text-muted-foreground">
              <Link to="/" search={{ circleId: data.circleId }} underline="hover">{data.circle.name}</Link>
              {data.seriesId ? <Link to="/" search={{ seriesId: data.seriesId }} className="ml-2" underline="hover">「{data.series?.name}」系列</Link> : null}
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
                  <MetaButton
                    key={artist.name}
                    asChild
                    metaType="artists"
                    size="sm"
                    disabled={!artist.id}
                  >
                    <Link to="/" search={{ artistId: [artist.id] }}>
                      <MicIcon />
                      {artist.name}
                    </Link>
                  </MetaButton>
                ))
              }
              {
                data.illustrators.map(illust => (
                  <MetaButton
                    key={illust.name}
                    asChild
                    metaType="illustrators"
                    size="sm"
                    disabled={!illust.id}
                  >
                    <Link to="/" search={{ illustratorId: illust.id }}>
                      <ImageIcon />
                      {illust.name}
                    </Link>
                  </MetaButton>
                ))
              }
            </div>

            <Separator className="opacity-0" />

            <div className="inline-flex flex-wrap gap-2 mt-auto">
              {
                data.genres.map(genre => (
                  <Badge key={genre.id} asChild variant="info" size="lg" className="hover:opacity-90 transition-opacity">
                    <Link to="/" search={{ genres: [genre.id] }}>
                      <TagIcon />
                      {genre.name}
                    </Link>
                  </Badge>
                ))
              }
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2 *:px-1">
              <Button asChild variant="link" size="sm" className="w-max hover:opacity-90">
                <Link to={externalUrl.dlsite(data.id)} isExternal underline="always">
                  DLsite
                </Link>
              </Button>

              <Button asChild variant="link" size="sm" className="w-max hover:opacity-90">
                <Link to={externalUrl.one(data.id)} isExternal underline="always">
                  ASMR.ONE
                </Link>
              </Button>

              {
                data.languageEditions.map(edition => (
                  edition.workId === data.id
                    ? null
                    : (
                      <Button key={edition.workId} asChild variant="link" size="sm" className="w-max hover:opacity-90">
                        <Link to="/work-details/$id" params={{ id: edition.workId }}>
                          {edition.label}
                        </Link>
                      </Button>
                    )
                ))
              }

              {
                data.translationInfo.childWorknos.map(childId => (
                  <Button key={childId} asChild variant="link" size="sm" className="w-max hover:opacity-90">
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
        <TracksTabale
          work={data}
          searchPath={searchPath}
          tracks={tracks.data}
          externalSubtitles={tracks.externalSubtitles}
          playback={data.playback}
        />
      )}

      {!isLoading && !tracks?.data && (
        <WorkPreview workId={data.id} originalId={data.originalId} className="block" />
      )}

      <SimilarWorks work={data} exists={data.exists} />
    </motion.div>
  );
}

function WorkDetailsWrapper() {
  const { id } = route.useParams();

  return (
    <ErrorBoundary key={id}>
      <Suspense fallback={<WorkDetailsSkeleton />}>
        <WorkDetails id={id} />
      </Suspense>
    </ErrorBoundary>
  );
}

const Route = createLazyRoute('/work-details/$id')({
  component: WorkDetailsWrapper
});

export default Route;
