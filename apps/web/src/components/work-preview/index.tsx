import useSWR from 'swr';
import { useState } from 'react'; // Activity 可能不再需要，因为我们用 opacity 控制
import { fetchJsonp } from 'foxact/fetch-jsonp';
import { withQuery } from '@asmr-collections/shared';

import { motion, AnimatePresence } from 'framer-motion';

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
  const [iframeLoading, setIframeLoading] = useState(true);

  const { data, isLoading } = useSWR<Embed>(key, fetcher);

  const embed = data?.works.at(0);

  const shouldShowLoading = (isLoading || iframeLoading) && !!embed;

  return (
    <div {...props} className={cn('w-full flex flex-col justify-center py-4', props.className)}>
      <AnimatePresence mode="popLayout">
        {shouldShowLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center gap-2 items-center text-muted-foreground"
          >
            <Spinner className="size-5" />
            <span className="text-sm">正在加载试听...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {embed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: iframeLoading ? 0 : 1,
            scale: iframeLoading ? 0.98 : 1
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="self-center"
        >
          <iframe
            title="embed preview player"
            onLoad={() => setIframeLoading(false)}
            src={embed.embed_url}
            width={embed.embed_width}
            height={iframeLoading ? 0 : embed.embed_height}
            allowFullScreen
            sandbox="allow-scripts"
            className="max-w-full max-h-[70vh]"
          />
        </motion.div>
      )}
    </div>
  );
}
