import { Link } from '~/components/link';
import { Image } from '~/components/image';
import { Separator } from '~/components/ui/separator';
import { MetaButton } from '~/components/meta-button';
import { Card, CardTitle } from '~/components/ui/card';
import { GenresPopover } from '~/components/work-card/genres-popover';
import { Carousel, CarouselContent, CarouselItem } from '~/components/ui/carousel';

import { memo, useRef } from 'react';
import { useSimilar } from '~/hooks/use-similar';

import Autoplay from 'embla-carousel-autoplay';

import { cn } from '~/lib/utils';
import { formatISODate } from '@asmr-collections/shared';

import type { Work } from '@asmr-collections/shared';

interface SimilarWorksProps {
  work: Work
  exists: boolean | undefined
}

export const SimilarWorks = memo(({ work, exists }: SimilarWorksProps) => {
  const pluginsRef = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
  const { data } = useSimilar(work.id, !!exists);

  if (!data || data.length === 0)
    return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-4">相似作品</h2>
      <Carousel
        opts={{
          align: 'start',
          skipSnaps: true
        }}
        plugins={[pluginsRef.current]}
      >
        <CarouselContent>
          {
            data.map(similarWork => (
              <CarouselItem
                className={cn(
                  'min-w-0 select-none cursor-grab',
                  'flex-[0_0_20%]',
                  'max-[440px]:flex-[0_0_100%]',
                  'max-[650px]:flex-[0_0_50%]',
                  'max-[780px]:flex-[0_0_33%]',
                  'md:flex-[0_0_25%]'
                )}
                key={similarWork.id}
              >
                <Card className="bg-zinc-100 dark:bg-zinc-900 overflow-hidden grid grid-rows-[auto_auto_1fr] h-full py-0 gap-2">
                  <div className="pb-[65%] relative">
                    <Link to="/work-details/$id" params={{ id: similarWork.id }} title={similarWork.name}>
                      <Image
                        src={similarWork.cover}
                        alt={similarWork.name}
                        classNames={{
                          wrapper: 'absolute inset-0'
                        }}
                      />
                    </Link>
                    <div
                      className={cn(
                        'block p-2 py-1 absolute bottom-0 right-0 bg-zinc-800/80 rounded-none rounded-tl-md text-sm',
                        'text-gray-300 max-w-[70%] truncate'
                      )}
                    >
                      {formatISODate(similarWork.releaseDate)}
                    </div>
                    {similarWork.seriesId
                      ? (
                        <Link
                          className={cn(
                            'block p-2 py-1 absolute bottom-0 left-0 bg-zinc-800/80 rounded-none rounded-tr-md text-sm',
                            'text-gray-300 max-w-[60%] truncate'
                          )}
                          to="/"
                          search={{ seriesId: similarWork.seriesId }}
                          underline="hover"
                        >
                          {similarWork.series?.name}
                        </Link>
                      )
                      : null}
                  </div>
                  <div className="px-2 flex flex-col gap-2">
                    <CardTitle className="line-clamp-2 leading-6 mb-2 min-h-12">
                      <Link to="/work-details/$id" params={{ id: similarWork.id }} title={similarWork.name}>
                        {similarWork.name}
                      </Link>
                    </CardTitle>
                    <Link
                      className="text-muted-foreground max-w-max"
                      to="/"
                      search={{ circleId: similarWork.circleId }}
                      underline="hover"
                    >
                      {similarWork.circle.name}
                    </Link>
                    <Separator className="dark:bg-zinc-700" />
                  </div>
                  <div className="space-y-2 flex flex-col px-2 pb-6">
                    <div className="flex-1 max-h-15">
                      <div className="line-clamp-3 text-sm opacity-80">{similarWork.intro}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {similarWork.artists.map(artist => (
                        <MetaButton
                          key={artist.id}
                          onPointerDown={e => e.preventDefault()}
                          metaType="artists"
                          size="sm"
                          asChild
                        >
                          <Link to="/" search={{ artistId: [artist.id] }}>{artist.name}</Link>
                        </MetaButton>
                      ))}
                      {similarWork.illustrators.map(illustrator => (
                        <MetaButton
                          key={illustrator.id}
                          onPointerDown={e => e.preventDefault()}
                          metaType="illustrators"
                          size="sm"
                          asChild
                        >
                          <Link to="/" search={{ illustratorId: illustrator.id }}>{illustrator.name}</Link>
                        </MetaButton>
                      ))}
                    </div>
                  </div>
                  <div className="flex p-6 pt-0 px-2 pb-2 gap-2 items-end w-full">
                    <GenresPopover genres={similarWork.genres} searchGenres={[]} />
                  </div>
                </Card>
              </CarouselItem>
            ))
          }
        </CarouselContent>
      </Carousel>
    </section>
  );
});
