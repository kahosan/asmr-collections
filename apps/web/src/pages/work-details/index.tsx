import { getRouteApi, Link } from '@tanstack/react-router';

import { Activity, useEffect, useEffectEvent } from 'react';

import { ImageIcon, MicIcon } from 'lucide-react';

import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';

import SimilarWorks from './similar';
import TracksTabale from './tracks-table';

import { toast } from 'sonner';
import { useAtomValue } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import { findSmartPath, notifyError, writeClipboard } from '~/utils';

import { cn } from '~/lib/utils';
import { fetcher } from '~/lib/fetcher';

import type { Work } from '~/types/work';
import type { Tracks } from '~/types/tracks';

interface WorkDetailsData {
  info?: Work
  tracks?: {
    data: Tracks
    fallback: boolean
    existsInLocal: boolean
  } | null
  error?: Error
}

const route = getRouteApi('/work-details/$id');

export default function WorkDetails() {
  const { id } = route.useParams();
  const navigate = route.useNavigate();
  const searchPath = route.useSearch({ select: ({ path }) => path });

  const isHiddenImage = useAtomValue(hiddenImageAtom);
  const settings = useAtomValue(settingOptionsAtom);

  const { data } = useSWRImmutable<WorkDetailsData>(
    `work-details-${id}`,
    fetcher,
    { suspense: true }
  );

  // 使用了 suspense 所以一定会有 data
  const handleOnSuccess = useEffectEvent(() => {
    if (!data) return;

    const { tracks, error, info } = data;

    if (error) {
      notifyError(error.cause, error.message);
      return;
    }
    if (!info) return;

    if (tracks?.fallback) {
      toast.success('成功回退至 ASMR.ONE 获取数据', {
        description: `${info.id} 不存在于本地库中`,
        id: `work-tracks-fallback-${info.id}`
      });
    }

    if (
      settings.smartPath.enable
      && !searchPath
      && tracks?.data
    ) {
      const targetPath = findSmartPath(tracks.data, settings.smartPath.pattern);

      if (targetPath && targetPath.length > 0)
        navigate({ search: { path: targetPath } });
    }
  });

  useEffect(() => {
    handleOnSuccess();
  }, []);

  if (!data?.info)
    throw new Error('作品数据请求失败，详情请查看控制台');

  const { info, tracks, error } = data;

  return (
    <>
      <Activity mode={settings.showWorkDetail ? 'visible' : 'hidden'}>
        <Card className="md:flex-row flex-col gap-1 p-0 overflow-hidden">
          <div className="w-full relative md:max-w-[40%] min-w-[40%] h-auto flex items-center">
            <div className="pb-[75%]" />
            <div className="bg-zinc-700 absolute inset-0 overflow-hidden">
              <img
                src={info.cover}
                alt={info.name}
                onLoad={e => { e.currentTarget.style.opacity = '1'; }}
                className={cn(
                  'object-cover object-center size-full opacity-0 transition-opacity',
                  isHiddenImage && 'filter blur-xl'
                )}
              />
              <Badge
                className="absolute top-2 left-2 bg-[#795548] dark:text-white font-bold shadow-md cursor-copy"
                onClick={() => {
                  writeClipboard(info.id, 'ID 已复制到剪贴板');
                }}
              >
                {info.id}
                {info.subtitles ? <span>带字幕</span> : null}
                {info.exists === false ? <span>未收藏</span> : null}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-2 w-full">
            <h2 className="sm:text-xl text-[20px] pt-2" title={info.name}>{info.name}</h2>
            <div className="opacity-70">
              <Link to="/" search={{ circleId: info.circleId }}>{info.circle.name}</Link>
              {info.seriesId ? <Link to="/" search={{ seriesId: info.seriesId }} className="ml-2">「{info.series?.name}」系列</Link> : null}
            </div>

            <Separator />

            <div className="text-sm">
              <span className="font-bold">销量：</span>
              <span>{info.sales}</span>
            </div>

            <div className="text-sm">
              <span className="font-bold">价格：</span>
              <span>{info.price}<sup className="ml-1">JPY</sup></span>
            </div>

            <div className="text-sm mb-2">
              <span className="font-bold">发行日期：</span>
              <span>{info.releaseDate}</span>
            </div>

            <div className="text-sm inline-flex items-center flex-wrap gap-2">
              {
                info.artists.map(artist => (
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
                info.illustrators.map(illust => (
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
                info.genres.map(genre => (
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
                <a href={`https://www.dlsite.com/maniax/work/=/product_id/${info.id}.html`} target="_blank" rel="noreferrer noopener">
                  DLsite
                </a>
              </Button>

              <Button asChild variant="link" size="sm" className="w-max hover:opacity-80">
                <a href={`https://asmr.one/work/${info.id}`} target="_blank" rel="noreferrer noopener">
                  ASMR.ONE
                </a>
              </Button>

              {
                info.languageEditions.map(edition => (
                  edition.workId === info.id
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
                info.translationInfo.childWorknos.map(childId => (
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
        <div className="bg-current/8 p-2 rounded-md text-sm">
          {info.intro}
        </div>
      </Activity>

      {tracks === undefined
        ? <div className="mt-2 text-sm opacity-65">{error?.message || '未知错误'}</div>
        : (tracks === null
          ? <p className="mt-2 text-sm opacity-65"> 当前作品不在本地库中，且未启用回退 ASMR.ONE。 </p>
          : <TracksTabale work={info} searchPath={searchPath} tracks={tracks.data} />)}

      <SimilarWorks work={info} />
    </>
  );
}
