import { getRouteApi, Link } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

import { Activity, Suspense } from 'react';

import { ImageIcon, MicIcon } from 'lucide-react';

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
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import { fetcher } from '~/lib/fetcher';
import { cn, writeClipboard } from '~/lib/utils';

import type { Work } from '~/types/work';

const route = getRouteApi('/work-details/$id');

export default function WorkDetails() {
  const { id } = route.useParams();
  const searchPath = route.useSearch({ select: ({ path }) => path });

  const isHiddenImage = useAtomValue(hiddenImageAtom);
  const settings = useAtomValue(settingOptionsAtom);

  const { data } = useSWRImmutable<Work>(
    `work-info-${id}`,
    fetcher,
    { suspense: true }
  );

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
              <span>{data.releaseDate}</span>
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
            </div>
          </div>
        </Card>
        <div className="bg-current/8 p-2 rounded-md text-sm">
          {data.intro}
        </div>
      </Activity>

      <ErrorBoundary
        FallbackComponent={e => {
          const errorText = 'message' in e.error ? e.error.message : '未知错误';
          return <div className="mt-2 text-sm opacity-65">{errorText}</div>;
        }}
      >
        <Suspense fallback={<TracksSkeleton />}>
          <TracksTabale work={data} searchPath={searchPath} settings={settings} />
        </Suspense>
      </ErrorBoundary>

      <SimilarWorks work={data} />
    </>
  );
}
