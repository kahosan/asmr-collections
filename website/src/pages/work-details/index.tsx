import { Link, useParams, useSearch } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

import { Activity, Suspense } from 'react';

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
import { cn, notifyError, writeClipboard } from '~/lib/utils';

import type { Work } from '~/types/work';

export default function WorkDetails() {
  const { id } = useParams({ from: '/work-details/$id' });
  const search = useSearch({ from: '/work-details/$id' });

  const isHiddenImage = useAtomValue(hiddenImageAtom);
  const settings = useAtomValue(settingOptionsAtom);

  // exists 在数据库中是否存在
  const { data } = useSWRImmutable<Work>(
    `work-info-${id}`,
    fetcher,
    {
      onError: e => notifyError(e, '获取作品信息失败'),
      suspense: true
    }
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

          <div className="flex flex-col gap-3 p-2">
            <h2 className="sm:text-xl text-[20px] pt-2" title={data.name}>{data.name}</h2>
            <div className="opacity-70">
              <Link to="/" search={{ circleId: data.circleId }}>{data.circle.name}</Link>
              {data.seriesId ? <Link to="/" search={{ seriesId: data.seriesId }} className="ml-2">「{data.series?.name}」系列</Link> : null}
            </div>

            <Separator />

            <div className="text-sm">
              <span className="font-bold">价格：</span>
              <span>{data.price}<sup className="ml-1">JPY</sup></span>
            </div>

            <div className="text-sm">
              <span className="font-bold">发行日期：</span>
              <span>{data.releaseDate}</span>
            </div>

            {
              data.artists.length > 0 && (
                <div className="text-sm inline-flex items-center flex-wrap gap-1">
                  <span className="font-bold">声优：</span>
                  {
                    data.artists.map(artist => (
                      <Link
                        disabled={!artist.id}
                        key={artist.name}
                        to="/"
                        search={{ artistId: [artist.id] }}
                        className="text-sm ml-1 p-1 px-2 rounded-md transition-opacity text-white hover:text-white bg-green-500/90 hover:opacity-80"
                      >{artist.name}</Link>
                    ))
                  }
                </div>
              )
            }

            {
              data.illustrators.length > 0 && (
                <div className="text-sm inline-flex items-center flex-wrap gap-1">
                  <span className="font-bold">画师：</span>
                  {
                    data.illustrators.map(illust => (
                      <Link
                        disabled={!illust.id}
                        key={illust.name}
                        to="/"
                        search={{ illustratorId: illust.id }}
                        className="text-sm ml-1 p-1 px-2 rounded-md transition-opacity text-white hover:text-white bg-blue-500 hover:opacity-80"
                      >
                        {illust.name}
                      </Link>
                    ))
                  }
                </div>
              )
            }

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

            <div className="flex flex-wrap gap-2 [&>*]:px-1">
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
          <TracksTabale work={data} search={search} settings={settings} />
        </Suspense>
      </ErrorBoundary>

      <SimilarWorks work={data} />
    </>
  );
}
