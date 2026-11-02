import { Audio } from '@videojs/react/audio';

import { AudioPlayer } from './player';
import { AudioPlayerLayout } from './layout';

import { focusAtom } from 'jotai-optics';
import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState } from 'react';

import { useMediaSrc } from './hooks/use-media-src';
import { usePrefetchNext } from './hooks/use-prefetch-next';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import type { MediaProps } from '../types';

const tracksAtom = focusAtom(mediaStateAtom, optic => optic.prop('tracks'));
const qualityAtom = focusAtom(settingOptionsAtom, optic => optic.prop('asmrone').prop('quality'));

export function AudioMedia({ track, subtitleSrc, prev, next, onTimeUpdate, ...events }: MediaProps) {
  const tracks = useAtomValue(tracksAtom);

  const quality = useAtomValue(qualityAtom);
  const url = quality === 'high'
    ? track?.mediaStreamUrl
    : (track?.streamLowQualityUrl || track?.mediaStreamUrl);

  const { mediaSrc, isTranscoded } = useMediaSrc(url);

  // 播放器 store 没有 loop 状态，由这里控制 <audio loop>
  const [loop, setLoop] = useState(false);

  const nextTrack = useMemo(() => {
    const currentIndex = tracks?.findIndex(item => item.title === track?.title);
    if (currentIndex === undefined || currentIndex === -1) return null;

    return tracks?.at(currentIndex + 1) || null;
  }, [track?.title, tracks]);

  const { triggerPrefetch } = usePrefetchNext(nextTrack?.mediaStreamUrl);

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    if (e.currentTarget.currentTime > 30)
      triggerPrefetch();

    onTimeUpdate(e);
  }, [onTimeUpdate, triggerPrefetch]);

  return createPortal(
    <div className="relative h-15 max-sm:z-10">
      <div className="fixed bottom-0 w-full">
        <AudioPlayer>
          <AudioPlayerLayout
            isTranscoded={isTranscoded}
            loop={loop}
            toggleLoop={() => setLoop(p => !p)}
            prev={prev}
            next={next}
          >
            <Audio
              autoPlay
              loop={loop}
              src={mediaSrc}
              onTimeUpdate={handleTimeUpdate}
              {...events}
            >
              {subtitleSrc && (
                <track
                  key={subtitleSrc}
                  default
                  kind="subtitles"
                  label="Chinese"
                  srcLang="zh"
                  src={subtitleSrc}
                />
              )}
            </Audio>
          </AudioPlayerLayout>
        </AudioPlayer>
      </div>
    </div>,
    document.body
  );
}
