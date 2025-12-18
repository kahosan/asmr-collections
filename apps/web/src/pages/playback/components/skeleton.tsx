/* eslint-disable @eslint-react/no-array-index-key -- ignore */

import { Image } from '~/components/image';

import { Skeleton } from '~/components/ui/skeleton';
import { ButtonGroup } from '~/components/ui/button-group';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemTitle } from '~/components/ui/item';

export function PlaybackSkeleton() {
  return (
    <ItemGroup>
      {Array.from({ length: 5 }).map((_, index) => (
        <Item variant="outline" className="bg-card p-0 sm:pr-4 sm:flex-nowrap" key={index}>
          <div className="max-sm:hidden">
            <Image alt="cover" classNames={{ wrapper: 'size-20 rounded-tl-md rounded-bl-md' }} />
          </div>
          <ItemHeader className="sm:hidden">
            <Image alt="cover" classNames={{ wrapper: 'pb-[65%] w-full rounded-tl-md rounded-tr-md' }} />
          </ItemHeader>
          <ItemContent className="gap-2 max-sm:gap-4 max-sm:p-4 max-sm:pt-0">
            <ItemTitle className="w-full">
              <Skeleton className="h-8 w-3/4" />
            </ItemTitle>
            <ItemDescription className="">
              <Skeleton className="h-4 w-2/3" />
            </ItemDescription>
            <ItemActions className="sm:hidden mt-2">
              <ButtonGroup className="w-full *:flex-1">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </ButtonGroup>
            </ItemActions>
          </ItemContent>
          <ItemActions className="max-sm:hidden">
            <ButtonGroup>
              <Skeleton className="h-8 w-15" />
              <Skeleton className="h-8 w-15" />
              <Skeleton className="h-8 w-15" />
            </ButtonGroup>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
