import { Link } from '@tanstack/react-router';

import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';

import { useAtomValue } from 'jotai';

import { hiddenImageAtom } from '~/hooks/use-hidden-image';

import { cn, writeClipboard } from '~/lib/utils';

import type { Work } from '~/types/work';

interface Props {
  work: Work
}

export default function Details({ work }: Props) {
  const isHiddenImage = useAtomValue(hiddenImageAtom);

  return (
    <>
      <Card className="md:flex-row flex-col gap-1 p-0 overflow-hidden">
        <div className="w-full relative md:max-w-[40%] min-w-[40%] h-auto flex items-center">
          <div className="pb-[75%]" />
          <div className="bg-zinc-700 absolute inset-0 overflow-hidden">
            <img
              src={work.cover}
              alt={work.name}
              onLoad={e => { e.currentTarget.style.opacity = '1'; }}
              className={cn(
                'object-cover object-center size-full opacity-0 transition-opacity',
                isHiddenImage && 'filter blur-xl'
              )}
            />
            <Badge
              className="absolute top-2 left-2 bg-[#795548] dark:text-white font-bold shadow-md cursor-default"
              onClick={() => {
                writeClipboard(work.id, 'ID 已复制到剪贴板');
              }}
            >
              {work.id}
              {work.subtitles ? <span>带字幕</span> : null}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-2">
          <h2 className="sm:text-xl text-[20px] pt-2" title={work.name}>{work.name}</h2>
          <div className="opacity-70">
            <Link to="/" search={{ circleId: work.circleId }}>{work.circle.name}</Link>
            {work.seriesId ? <Link to="/" search={{ seriesId: work.seriesId }} className="ml-2">「{work.series?.name}」系列</Link> : null}
          </div>

          <Separator />

          <div className="text-sm">
            <span className="font-bold">价格：</span>
            <span>{work.price}<sup className="ml-1">JPY</sup></span>
          </div>

          <div className="text-sm">
            <span className="font-bold">发行日期：</span>
            <span>{work.releaseDate}</span>
          </div>

          {
            work.artists.length > 0 && (
              <div className="text-sm">
                <span className="font-bold">声优：</span>
                {
                  work.artists.map(artist => (
                    <Link
                      key={artist.id}
                      to="/"
                      search={{ artistId: [artist.id] }}
                      className="text-sm text-white ml-1 p-1 px-2 bg-green-500/80 rounded-md"
                    >{artist.name}</Link>
                  ))
                }
              </div>
            )
          }

          {
            work.illustrators.length > 0 && (
              <div className="text-sm">
                <span className="font-bold">画师：</span>
                {
                  work.illustrators.map(illust => (
                    <Link
                      key={illust.id}
                      to="/"
                      search={{ illustratorId: illust.id }}
                      className="text-sm text-white ml-1 p-1 px-2 bg-blue-500 rounded-md"
                    >
                      {illust.name}
                    </Link>
                  ))
                }
              </div>
            )
          }

          <Separator className="opacity-0" />

          <div className="inline-flex flex-wrap gap-1 mt-auto">
            {
              work.genres.map(genre => (
                <Link
                  key={genre.id}
                  to="/"
                  search={{ genres: [genre.id] }}
                  className="text-sm p-1 px-2 bg-zinc-200 dark:bg-zinc-700 rounded-md"
                >
                  {genre.name}
                </Link>
              ))
            }
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2 [&>*]:px-1">
            <Button asChild variant="link" size="sm" className="w-max">
              <a href={`https://www.dlsite.com/maniax/work/=/product_id/${work.id}.html`} target="_blank" rel="noreferrer noopener">
                DLsite
              </a>
            </Button>

            <Button asChild variant="link" size="sm" className="w-max">
              <a href={`https://asmr.one/work/${work.id}`} target="_blank" rel="noreferrer noopener">
                ASMR.ONE
              </a>
            </Button>

            {
              work.languageEditions.map(edition => (
                edition.workId === work.id
                  ? null
                  : (
                    <Button key={edition.workId} asChild variant="link" size="sm" className="w-max">
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
        {work.intro}
      </div>
    </>
  );
}
