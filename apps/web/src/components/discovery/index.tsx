import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { WorkCard } from '~/components/work-card';
import { NativeSelect } from '~/components/ui/native-select';
import { ButtonGroup, ButtonGroupSeparator } from '~/components/ui/button-group';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '~/components/ui/carousel';

import { DiscoveryWorksSkeleton } from './skeleton';
import { ExternalWorkCard } from './external-work-card';

import { cn } from '~/lib/utils';
import { DLsiteRankPeriodSchema } from '@asmr-collections/shared';

import type { DiscoveryNavigation } from '~/hooks/use-discovery';
import type { DiscoveryItem, DLsiteRankPeriod } from '@asmr-collections/shared';

interface DiscoveryWorksProps {
  error: unknown
  data: DiscoveryItem[] | undefined
  isLoading: boolean
  className?: string
  compact?: boolean
  carousel?: boolean
  onRetry?: () => void
  onExternalAdded?: () => void | Promise<void>
}

const carouselItemClass = [
  'min-w-0 select-none cursor-grab',
  'flex-[0_0_clamp(300px,25%,400px)]',
  'max-[780px]:flex-[0_0_clamp(300px,50%,400px)]',
  'max-[440px]:flex-[0_0_100%]'
];

export function DiscoveryCarouselItem({ children }: { children: React.ReactNode }) {
  return <CarouselItem className={cn(...carouselItemClass)}>{children}</CarouselItem>;
}

export function DiscoveryWorks({ error, data, isLoading, className, compact = false, carousel = false, onRetry, onExternalAdded }: DiscoveryWorksProps) {
  if (error) {
    return (
      <div className="text-center py-6 space-y-2" role="alert">
        <p className="opacity-65">获取推荐失败</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry} disabled={isLoading}>重试</Button>}
      </div>
    );
  }

  if (isLoading || !data)
    return <DiscoveryWorksSkeleton compact={compact} carousel={carousel} />;

  if (data.length === 0)
    return <div className="text-center opacity-65 my-6">暂无推荐作品</div>;

  if (carousel) {
    return (
      <Carousel
        className={className}
        opts={{ align: 'start', skipSnaps: true }}
        aria-label="推荐作品"
      >
        <CarouselContent>
          {data.map(item => (
            <DiscoveryCarouselItem key={`${item.kind}:${item.work.id}`}>
              <div className="relative h-full">
                {item.kind === 'external'
                  ? (
                    <ExternalWorkCard
                      work={item.work}
                      provider={item.provider}
                      rank={item.rank}
                      onAdded={onExternalAdded}
                    />
                  )
                  : (
                    <>
                      <WorkCard work={item.work} />
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {item.rank !== undefined && (
                          <Badge variant="info" className="dark:text-white font-bold shadow-md">
                            #{item.rank}
                          </Badge>
                        )}
                        <Badge variant="info" className="dark:text-white font-bold shadow-md">
                          {item.reason}
                        </Badge>
                      </div>
                    </>
                  )}
              </div>
            </DiscoveryCarouselItem>
          ))}
        </CarouselContent>
        {data.length > 1 && (
          <>
            <CarouselPrevious className="-left-12 hidden sm:flex" />
            <CarouselNext className="-right-12 hidden sm:flex" />
          </>
        )}
      </Carousel>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4',
      compact && 'grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]',
      className
    )}
    >
      {data.map(item => (
        <div className="relative" key={`${item.kind}:${item.work.id}`}>
          {item.kind === 'external'
            ? (
              <ExternalWorkCard
                work={item.work}
                provider={item.provider}
                rank={item.rank}
                onAdded={onExternalAdded}
              />
            )
            : (
              <>
                <WorkCard work={item.work} />
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                  {item.rank !== undefined && (
                    <Badge variant="info" className="dark:text-white font-bold shadow-md">
                      #{item.rank}
                    </Badge>
                  )}
                  <Badge variant="info" className="dark:text-white font-bold shadow-md">
                    {item.reason}
                  </Badge>
                </div>
              </>
            )}
        </div>
      ))}
    </div>
  );
}

interface DiscoverySectionProps {
  title: string
  data?: DiscoveryItem[]
  isLoading?: boolean
  error?: unknown
  navigation?: DiscoveryNavigation
  action?: React.ReactNode
  period?: DLsiteRankPeriod
  onPeriodChange?: (period: DLsiteRankPeriod) => void
  className?: string
  compact?: boolean
  onExternalAdded?: () => void | Promise<void>
}

export function DiscoverySection({
  title,
  data,
  isLoading = false,
  error,
  navigation,
  action,
  period,
  onPeriodChange,
  className,
  compact = false,
  onExternalAdded
}: DiscoverySectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-2xl font-medium">{title}</h2>
        <div className="flex items-center gap-2 flex-auto justify-end">
          {action}
          {period && onPeriodChange && (
            <NativeSelect
              value={period}
              onChange={e => {
                const valid = DLsiteRankPeriodSchema.safeParse(e.target.value);
                if (!valid.data) return;
                onPeriodChange(valid.data);
              }}
              aria-label="DLsite 榜单周期"
            >
              <option value="day">24 小时</option>
              <option value="week">周榜</option>
              <option value="month">月榜</option>
              <option value="total">总榜</option>
            </NativeSelect>
          )}
          {navigation && (
            <div className="flex items-center gap-2 max-sm:ml-auto" role="group" aria-label={`${title}批次切换`}>
              <ButtonGroup>
                <Button
                  variant="outline"
                  onClick={navigation.previous}
                  disabled={!navigation.hasPrevious || navigation.isLoading}
                >
                  <ChevronLeftIcon />
                </Button>
                <ButtonGroupSeparator />
                <Button
                  variant="outline"
                  onClick={navigation.next}
                  disabled={!navigation.hasNext || navigation.isLoading}
                  title={navigation.hasNext ? undefined : '暂无更多推荐作品'}
                  className="relative"
                >
                  <ChevronRightIcon />
                  <Badge className="absolute -top-2 -right-2 size-5 rounded-full" variant="secondary">
                    {navigation.page}
                  </Badge>
                </Button>
              </ButtonGroup>
            </div>
          )}
        </div>
      </div>
      <DiscoveryWorks
        isLoading={isLoading}
        error={error}
        data={data}
        compact={compact}
        onRetry={navigation?.next}
        onExternalAdded={onExternalAdded}
      />
    </section>
  );
}
