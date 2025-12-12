import { useCallback, useRef } from 'react';

import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';

import { useTranscodeOptions } from '~/hooks/use-transcode-options';

import { HTTPError, withQuery } from '@asmr-collections/shared';

import { logger } from '~/lib/logger';

export function useMediaSrc(url: string | undefined) {
  const [options] = useTranscodeOptions();

  const fetcher = async () => {
    if (!url || options.mode === 'disable') return url;

    const newURL = withQuery(url, { bitrate: options.bitrate });
    const response = await fetch(newURL, { method: 'HEAD' });

    const transcodeStatus = decodeURIComponent(response.headers.get('x-transcode-status') ?? '未知转码状态');

    if (response.status === 200 || response.status === 206 || response.status === 304) {
      toast.dismiss('transcode-status');
      return newURL;
    }

    if (response.status === 202) {
      toast.loading(transcodeStatus, { id: 'transcode-status' });
      logger.info(transcodeStatus);
      throw new HTTPError(transcodeStatus, 202);
    }

    if (response.status >= 400)
      throw new HTTPError(transcodeStatus, response.status);
  };

  const { data, mutate } = useSWRImmutable<string | undefined>(
    url ? [url, options.bitrate, options.mode] : null,
    fetcher,
    {
      onErrorRetry(error, _key, _config, revalidate) {
        if (error instanceof HTTPError && error.status === 202) {
          // eslint-disable-next-line sukka/prefer-timer-id -- ignore
          setTimeout(() => revalidate(), 1000 * 3);
          return;
        }

        if (error instanceof Error) {
          toast.dismiss('transcode-status');
          toast.error('转码失败', {
            description: error.message,
            duration: Infinity,
            action: {
              label: '重试',
              onClick: () => mutate()
            }
          });
          logger.error(error, '转码失败');
        }
      }
    }
  );

  const nextUrlRef = useRef<string | null>(null);

  const preTranscodeNext = useCallback((nextUrl: string | undefined) => {
    if (nextUrlRef.current === nextUrl) return;
    if (!nextUrl || options.mode === 'disable') return;

    const newURL = withQuery(nextUrl, { bitrate: options.bitrate });

    logger.info('预转码下一首');
    fetch(newURL, { method: 'HEAD' })
      .catch(e => logger.error(e, '预转码下一首失败'));

    nextUrlRef.current = nextUrl;
  }, [options.bitrate, options.mode]);

  return { mediaSrc: data, preTranscodeNext };
}
