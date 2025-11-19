import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Separator } from '~/components/ui/separator';
import TracksSkeleton from './tracks-skeleton';

export default function WorkDetailsSkeleton() {
  return (
    <>
      <Card className="md:flex-row flex-col gap-1 p-0 overflow-hidden">
        <div className="w-full relative md:max-w-[40%] min-w-[40%] h-auto flex items-center">
          <div className="pb-[75%]" />
          <div className="bg-zinc-700 absolute inset-0 overflow-hidden">
            <Skeleton className="size-full rounded-none" />
            <Skeleton className="absolute top-2 left-2 w-20 h-6" />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-2 w-full">
          <Skeleton className="h-7 w-[65%] mt-2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
          </div>

          <Separator />

          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-48" />

          <Separator className="opacity-0" />

          <div className="inline-flex flex-wrap gap-2 mt-auto">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </Card>

      <Skeleton className="bg-current/8 h-12 rounded-md my-4" />

      <TracksSkeleton />
    </>
  );
}
