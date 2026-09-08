import type {
  DiscoveryExternalWork,
  DiscoveryHotProvider
} from '@asmr-collections/shared';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Image } from '~/components/image';
import { Link } from '~/components/link';
import { useToastMutation } from '~/hooks/use-toast-fetch';
import { mutateWorks } from '~/lib/mutation';
import { externalUrl, writeClipboard } from '~/utils';

interface Props {
  work: DiscoveryExternalWork
  provider: Exclude<DiscoveryHotProvider, 'personal'>
  rank: number
  onAdded?: () => void | Promise<void>
}

export function ExternalWorkCard({ work, provider, rank, onAdded }: Props) {
  const [createAction, isMutating] = useToastMutation<{ message?: string }>('create');

  const sourceName = provider === 'dlsite' ? 'DLsite' : 'ASMR.ONE';
  const sourceHref = provider === 'dlsite'
    ? externalUrl.dlsite(work.id)
    : externalUrl.one(work.id);
  const circleHref = provider === 'dlsite'
    ? externalUrl.dlsiteCircle(work.circle.id)
    : undefined;
  const visibleGenres = work.genres.slice(0, 5);
  const hiddenGenreCount = Math.max(0, work.genres.length - visibleGenres.length);

  const handleCreate = () => {
    createAction({
      key: `/api/work/create/${work.id}`,
      fetchOps: { method: 'POST' },
      toastOps: {
        loading: `${work.id} 添加中...`,
        success(data) {
          mutateWorks();
          onAdded?.();
          return data.message ?? `${work.id} 添加成功`;
        },
        error: `${work.id} 添加失败`
      }
    });
  };

  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 overflow-hidden grid grid-rows-[auto_auto_1fr_auto] h-full py-0 gap-2">
      <div className="pb-[65%] relative">
        <Link to={sourceHref} isExternal title={work.name}>
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
          {sourceName}
        </Badge>

        <Badge variant="info" className="absolute top-2 right-2 dark:text-white font-bold shadow-md">
          #{Math.max(1, rank)}
        </Badge>
      </div>

      <div className="px-2 flex flex-col gap-2">
        <CardTitle className="line-clamp-2 leading-6 mb-2 min-h-12">
          <Link to={sourceHref} isExternal title={work.name}>
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
          {visibleGenres.map(genre => (
            <Badge variant="outline" key={`${genre.id}:${genre.name}`}>
              {genre.name}
            </Badge>
          ))}
          {hiddenGenreCount > 0 && (
            <Badge variant="outline" title={work.genres.slice(visibleGenres.length).map(genre => genre.name).join('、')}>
              +{hiddenGenreCount}
            </Badge>
          )}
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
          <Link to={sourceHref} isExternal showAnchorIcon>
            打开来源
          </Link>
        </Button>
      </div>
    </Card>
  );
}
