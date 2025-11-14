import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardTitle } from '../ui/card';

import { Link } from '@tanstack/react-router';

import { ImageIcon, MicIcon } from 'lucide-react';

import Menu from './menu';
import BadgeMenu from './badge-menu';
import GenresPopover from './genres-popover';
import AuditionDrawer from './audition-drawer';

import { voiceLibraryOptionsAtom } from '~/hooks/use-setting-options';

import { match } from 'ts-pattern';
import { useAtomValue } from 'jotai';
import useSWRImmutable from 'swr/immutable';
import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { useGenerateSearch } from '~/hooks/use-generate-search';

import { fetcher } from '~/lib/fetcher';
import { cn, notifyError, writeClipboard } from '~/lib/utils';

import type { Work } from '~/types/work';

interface Props {
  work: Work
  showMenus?: boolean
  showImageBadge?: boolean
}

export default function WorkCard({ work, showMenus = true, showImageBadge = true }: Props) {
  const isHiddenImage = useAtomValue(hiddenImageAtom);
  const options = useAtomValue(voiceLibraryOptionsAtom);

  const { search, exclude, include } = useGenerateSearch();

  const existsApi = options.showMissingTagsInLocalVL && showImageBadge
    ? `/api/library/exists/${work.id}`
    : null;

  const { data } = useSWRImmutable<{ exists: boolean }>(existsApi, fetcher, {
    onError: error => notifyError(error, '检查是否存在于音声库时出错')
  });

  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 overflow-hidden grid grid-rows-[auto_auto_1fr] h-full py-0 gap-2">
      <div className="pb-[65%] relative bg-zinc-700 overflow-hidden">
        <Link to="/work-details/$id" params={{ id: work.id }} title={work.name}>
          <img
            src={work.cover}
            alt={work.name}
            onLoad={e => { e.currentTarget.style.opacity = '1'; }}
            className={
              cn(
                'object-cover object-center absolute top-0 left-0 right-0 bottom-0 w-full h-full opacity-0 transition-opacity',
                isHiddenImage && 'filter blur-xl'
              )
            }
          />
        </Link>
        {
          showImageBadge ? (
            <>
              <Badge
                className="absolute top-2 left-2 bg-[#795548] dark:text-white font-bold shadow-md cursor-copy"
                onClick={() => {
                  writeClipboard(work.id, 'ID 已复制到剪贴板');
                }}
              >
                {work.id}
                {work.subtitles ? <span>带字幕</span> : null}
              </Badge>
              <Badge
                className={cn(
                  'absolute top-10 left-2 dark:text-white shadow-md font-bold',
                  match(work.ageCategory)
                    .with(3, () => 'bg-red-500')
                    .with(2, () => 'bg-blue-500')
                    .otherwise(() => 'bg-emerald-500')
                )}
              >
                {
                  match(work.ageCategory)
                    .with(1, () => '全年龄')
                    .with(2, () => 'R15')
                    .otherwise(() => 'R18')
                }
              </Badge>
              {
                data?.exists === false
                  ? (
                    <Badge className="absolute top-2 right-2 bg-[#795548] dark:text-white font-bold shadow-md cursor-default">
                      不存在于本地库
                    </Badge>
                  )
                  : null
              }
            </>
          ) : null
        }
        <div
          className={cn(
            'truncate block',
            'p-2 py-1 absolute bottom-0 right-0 bg-zinc-800/80 rounded-none rounded-tl-md text-sm',
            'text-gray-300 max-w-[70%] truncate'
          )}
        >
          {work.releaseDate}
        </div>
        {
          work.seriesId
            ? (
              <Link
                className={cn(
                  'truncate block hover:underline underline-offset-4',
                  'p-2 py-1 absolute bottom-0 left-0 bg-zinc-800/80 rounded-none rounded-tr-md text-sm',
                  'text-gray-300 max-w-[60%] truncate'
                )}
                to="/"
                search={include(['sort', 'order', 'filterOp'], { seriesId: work.seriesId })}
              >
                {work.series?.name}
              </Link>
            )
            : null
        }
      </div>
      <div className="px-2 flex flex-col gap-2">
        <CardTitle className="line-clamp-2 leading-6 mb-2 min-h-12">
          <Link to="/work-details/$id" params={{ id: work.id }} title={work.name}>
            {work.name}
          </Link>
        </CardTitle>
        <Link
          className="hover:underline underline-offset-4 opacity-60 max-w-max"
          to="/"
          search={include(['sort', 'order', 'filterOp'], { circleId: work.circleId })}
        >
          {work.circle.name}
        </Link>
        <Separator className="dark:bg-zinc-700" />
      </div>
      <div className="space-y-2 flex flex-col px-2 pb-6">
        <div className="flex-1 max-h-[60px]">
          <div className="line-clamp-3 text-sm opacity-80">{work.intro}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {work.artists.map(artist => (
            <BadgeMenu
              key={artist.id}
              text={artist.name}
              search={exclude(['page', 'keyword'], { artistId: [artist.id] })}
              icon={<MicIcon />}
              variant="green"
              isFilter={search.artistId?.includes(artist.id)}
            />
          ))}
          {work.illustrators.map(illustrator => (
            <BadgeMenu
              key={illustrator.id}
              text={illustrator.name}
              search={exclude(['page', 'keyword'], { illustratorId: illustrator.id })}
              icon={<ImageIcon />}
              variant="blue"
              isFilter={search.illustratorId === illustrator.id}
            />
          ))}
        </div>
      </div>
      <div className="flex p-6 pt-0 px-2 pb-2 gap-2 items-end w-full">
        <GenresPopover genres={work.genres} searchGenres={search.genres} key={search.genres?.join('')} />
        {
          showMenus
            ? (
              <>
                <AuditionDrawer workId={work.id} originalId={work.originalId} />
                <Menu work={work} />
              </>
            )
            : null
        }
      </div>
    </Card>
  );
}
