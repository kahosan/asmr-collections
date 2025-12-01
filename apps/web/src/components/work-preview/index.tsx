import useSWR from 'swr';
import { fetchJsonp } from 'foxact/fetch-jsonp';
import { withQuery } from '@asmr-collections/shared';

import { Spinner } from '../ui/spinner';

import { cn } from '~/lib/utils';

async function fetcher<T>(key: string) {
  return fetchJsonp<T>(callbackName => `${key}&callback=${callbackName}`);
}

interface Embed {
  works: Array<{ embed_url: string, embed_width: number, embed_height: number }>
}

interface WorkPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  workId: string
  originalId?: string | null
}

export default function WorkPreview({ workId, originalId, ...props }: WorkPreviewProps) {
  const key = withQuery('https://chobit.cc/api/v1/dlsite/embed', { workno: originalId ?? workId });

  const { data, isLoading } = useSWR<Embed>(key, fetcher);

  const embed = data?.works.at(0);

  return (
    <div {...props} className={cn('w-full flex justify-center', props.className)}>
      {
        isLoading
          ? <div className="flex justify-center gap-2 items-center"><Spinner className="min-size-5" /> 正在加载试听</div>
          : <iframe title="embed preview player" src={embed?.embed_url} width={embed?.embed_width} height={embed?.embed_height} allowFullScreen sandbox="allow-popups allow-scripts" className="max-w-full" />
      }
    </div>
  );
}
