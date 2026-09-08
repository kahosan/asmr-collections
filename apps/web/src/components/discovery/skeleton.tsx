import { Carousel, CarouselContent } from '~/components/ui/carousel';
import { WorkSkeleton } from '~/components/works/skeleton';

import { cn } from '~/lib/utils';
import { DiscoveryCarouselItem } from '.';

interface DiscoveryWorksSkeletonProps {
  compact?: boolean
  carousel?: boolean
  count?: number
}

export function DiscoveryWorksSkeleton({ compact = false, carousel = false, count }: DiscoveryWorksSkeletonProps) {
  const works = Array.from({ length: count ?? (compact ? 4 : 6) }, (_, index) => index);

  if (carousel) {
    return (
      <Carousel opts={{ align: 'start', skipSnaps: true }} aria-label="推荐作品加载中">
        <CarouselContent>
          {works.map(key => (
            <DiscoveryCarouselItem key={key}>
              <WorkSkeleton />
            </DiscoveryCarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4',
      compact && 'grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]'
    )}
    >
      {works.map(key => <WorkSkeleton key={key} />)}
    </div>
  );
}
