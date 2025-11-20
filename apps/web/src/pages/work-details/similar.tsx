import WorkCard from '~/components/work-card';
import { Carousel, CarouselContent, CarouselItem } from '~/components/ui/carousel';

import Autoplay from 'embla-carousel-autoplay';

import { cn } from '~/lib/utils';

import type { Work } from '~/types/work';
import { useSimilar } from '~/hooks/use-similar';

interface SimilarWorksProps {
  work: Work
}

export default function SimilarWorks({ work }: SimilarWorksProps) {
  const { data } = useSimilar(work.id);

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
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
      >
        <CarouselContent>
          {
            data.map(similarWork => (similarWork.id === work.id
              ? null
              : (
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
                  <WorkCard work={similarWork} showMenus={false} showImageBadge={false} />
                </CarouselItem>
              )))
          }
        </CarouselContent>
      </Carousel>
    </section>
  );
}
