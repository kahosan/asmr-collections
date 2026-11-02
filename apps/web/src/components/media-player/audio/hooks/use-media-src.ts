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

    if (response.status === 200 || response.status === 206 || response.status === 304) {
      toast.dismiss('transcode-status');
      return newURL;
    }

    if (response.status === 202) {
      const message = '转码中，请耐心等待...';
      toast.loading(message, {
        id: 'transcode-status',
        description: '根据文件大小，这可能需要几分钟或数十分钟'
      });
      throw new HTTPError(message, 202);
    }

    if (response.status >= 400) {
      const transcodeStatus = decodeURIComponent(response.headers.get('x-transcode-status') ?? '未知错误');
      throw new HTTPError(transcodeStatus, response.status);
    }
  };

  const { data, mutate } = useSWRImmutable<string | undefined>(
    url ? [url, options.bitrate, options.mode] : null,
    fetcher,
    {
      keepPreviousData: true,
      onErrorRetry(error, _key, _config, revalidate) {
        if (error instanceof HTTPError && error.status === 202) {
          // eslint-disable-next-line sukka/prefer-timer-id -- ignore
          setTimeout(() => revalidate(), 1000 * 2);
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

  return { mediaSrc: data, isTranscoded: !!(data && data !== url) };
}
