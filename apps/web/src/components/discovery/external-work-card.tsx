import type {
  DiscoveryExternalWork,
  DiscoveryProvider
} from '@asmr-collections/shared';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Image } from '~/components/image';
import { Link } from '~/components/link';
import { useWorkAction } from '~/hooks/use-work-action';
import { externalUrl, writeClipboard } from '~/utils';

interface Props {
  work: DiscoveryExternalWork
  provider: DiscoveryProvider
  rank: number
}

export function ExternalWorkCard({ work, provider, rank }: Props) {
  const [createAction, isMutating] = useWorkAction('create');

  const source = provider === 'dlsite' ? 'DLsite' : 'ASMR.ONE';
  const circleHref = externalUrl.dlsiteCircle(work.circle.id);

  const handleCreate = () => {
    createAction(work.id);
  };

  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 overflow-hidden grid grid-rows-[auto_auto_1fr_auto] h-full py-0 gap-2">
      <div className="pb-[65%] relative">
        <Link to="/work-details/$id" params={{ id: work.id }} isExternal title={work.name}>
          <Image
            src={work.cover}
            alt={work.name}
            classNames={{ wrapper: 'absolute inset-0' }}
          />
        </Link>

        <Badge
          variant="outline"
          className="absolute top-2 left-2 bg-zinc-700 text-white border-transparent font-bold shadow-md cursor-copy"
          title={work.id}
          onClick={() => writeClipboard(work.id, 'ID 已复制到剪贴板')}
        >
          {work.id}
        </Badge>
        <Badge className="absolute top-10 left-2 bg-[#795548] dark:text-white font-bold shadow-md">
          {source}
        </Badge>

        <Badge variant="info" className="absolute top-2 right-2 dark:text-white font-bold shadow-md">
          #{Math.max(1, rank)}
        </Badge>
      </div>

      <div className="px-2 flex flex-col gap-2">
        <CardTitle className="line-clamp-2 leading-6 mb-2 min-h-12">
          <Link to="/work-details/$id" params={{ id: work.id }} isExternal title={work.name}>
            {work.name}
          </Link>
        </CardTitle>
        {circleHref
          ? (
            <Link
              className="text-muted-foreground max-w-max truncate"
              to={circleHref}
              isExternal
              underline="hover"
              title={work.circle.name}
            >
              {work.circle.name}
            </Link>
          )
          : (
            <div className="text-muted-foreground max-w-max truncate" title={work.circle.name}>
              {work.circle.name}
            </div>
          )}
        <Separator className="dark:bg-zinc-700" />
      </div>

      <div className="space-y-2 flex flex-col px-2 pb-2">
        <div className="flex-1 min-h-15">
          <div className="line-clamp-3 text-sm opacity-80">
            {work.intro || '暂无简介'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {work.genres.map(genre => (
            <Badge variant="outline" key={`${genre.id}:${genre.name}`}>
              {genre.name}
            </Badge>
          ))}
          {work.genres.length === 0 && (
            <span className="text-sm text-muted-foreground">暂无标签</span>
          )}
        </div>
      </div>

      <div className="flex p-6 pt-0 px-2 pb-2 gap-2 items-center w-full">
        <Button
          className="flex-1 min-w-0"
          onClick={handleCreate}
          variant="outline"
          size="lg"
          disabled={isMutating}
        >
          <span className="text-sm">收藏到本库</span>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to={provider === 'dlsite' ? externalUrl.dlsite(work.id) : externalUrl.one(work.id)} isExternal showAnchorIcon>
            打开来源
          </Link>
        </Button>
      </div>
    </Card>
  );
}
