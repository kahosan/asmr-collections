import { Card, CardContent, CardHeader } from '../ui/card';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';

export function WorkSkeleton() {
  return (
    <Card className="dark:bg-zinc-900 gap-2 py-0">
      <CardHeader className="px-0 pt-0 pb-1">
        <Skeleton className="w-full pb-[65%] rounded-b-none" />
      </CardHeader>
      <CardContent className="pt-2 px-2 flex flex-col gap-4">
        <Skeleton className="mb-2 h-12" />
        <Separator className="dark:bg-zinc-700" />
        <Skeleton className="w-full h-12" />
        <div className="flex flex-wrap gap-2 mb-2">
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-24 h-8" />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="w-20 h-8" />
          <Skeleton className="w-20 h-8" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkSkeletons() {
  const works = Array.from({ length: 6 }, (_, i) => i);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,auto))] gap-4">
      {works.map(key => (
        <WorkSkeleton key={key} />
      ))}
    </div>
  );
}
