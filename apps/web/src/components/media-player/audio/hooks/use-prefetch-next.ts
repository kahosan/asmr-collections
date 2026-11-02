import useSWRImmutable from 'swr/immutable';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranscodeOptions } from '~/hooks/use-transcode-options';

import { logger } from '~/lib/logger';
import { HTTPError, withQuery } from '@asmr-collections/shared';

export function usePrefetchNext(nextUrl: string | undefined) {
  const [options] = useTranscodeOptions();
  const [prefetchedUrl, setPrefetchedUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  const fetcher = async () => {
    if (!nextUrl) return;

    let newURL = nextUrl;
    if (options.mode !== 'disable')
      newURL = withQuery(nextUrl, { bitrate: options.bitrate });

    try {
      const response = await fetch(newURL, { method: 'HEAD' });

      if (response.status === 202)
        throw new HTTPError('转码中，跳过预加载', 202);

      if (response.ok) {
        audioRef.current = new Audio(newURL);
        audioRef.current.preload = 'auto';
        logger.info(`预加载下一个音频: ${newURL}`);
      }
    } catch (e) {
      if (e instanceof HTTPError) throw e;

      logger.error(e, '预加载下一个音频失败');
    }
  };

  const swrKey = (nextUrl && nextUrl === prefetchedUrl)
    ? [nextUrl, options.bitrate, options.mode, 'prefetch']
    : null;

  useSWRImmutable(
    swrKey,
    fetcher,
    {
      onErrorRetry(error, _key, _config, revalidate, { retryCount }) {
        if (error instanceof HTTPError && error.status === 202 && retryCount < 10) {
          // eslint-disable-next-line sukka/prefer-timer-id -- ignore
          setTimeout(() => revalidate(), 1000 * 5);
        }
      }
    }
  );

  const triggerPrefetch = useCallback(() => {
    if (!nextUrl || nextUrl === prefetchedUrl) return;

    setPrefetchedUrl(nextUrl);
  }, [nextUrl, prefetchedUrl]);

  return { triggerPrefetch };
};
