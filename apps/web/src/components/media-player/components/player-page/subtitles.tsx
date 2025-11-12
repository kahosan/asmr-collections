import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { TextTrack } from '@vidstack/react';

import { focusAtom } from 'jotai-optics';
import { useAtomValue } from 'jotai/react';
import { mediaStateAtom } from '~/hooks/use-media-state';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { Button } from '~/components/ui/button';
import SubtitleSelector from './subtitle-selector';
import { RefreshCwIcon, RefreshCwOffIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '~/lib/utils';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 100)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}.${ms}`;
}

const allSubtitlesAtom = focusAtom(mediaStateAtom, optic => optic.prop('allSubtitles'));

interface SubtitlesProps {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
}

export default function Subtitles({ scrollAreaRef }: SubtitlesProps) {
  const remote = useMediaRemote();
  const textTrackState = useMediaState('textTrack');
  const currentTime = useMediaState('currentTime');

  const allSubtitles = useAtomValue(allSubtitlesAtom);

  const targetRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Element | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);

  const [textTrack, setTextTrack] = useState<TextTrack | null>(textTrackState);

  const activeCueIndex = useMemo(() => {
    const cues = textTrack?.cues as VTTCue[] | undefined;
    if (!cues) return -1;

    return cues.findIndex((cue, index) => {
      if (currentTime >= cue.startTime && currentTime <= cue.endTime)
        return true;
      const nextCue = cues.at(index + 1);
      if (!nextCue) return false;
      return currentTime <= nextCue.startTime && currentTime >= cue.endTime;
    });
  }, [textTrack, currentTime]);

  const handleCueClick = (startTime: number) => {
    remote.seek(startTime + 0.5);
  };

  const handleAutoScrollChange = () => {
    setAutoScroll(p => !p);

    if (viewportRef.current && activeCueIndex) {
      if (!targetRef.current) return;
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  };

  const isAutoScroll = useEffectEvent(() => {
    return autoScroll;
  });

  useEffect(() => {
    // 自动滚动
    if (viewportRef.current && activeCueIndex) {
      if (!isAutoScroll() || !targetRef.current) return;
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCueIndex]);

  useEffect(() => {
    if (!textTrackState) return;

    viewportRef.current = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') ?? null;
    const viewport = viewportRef.current;

    const onLoad = () => {
      // 为什么要自建一个 state，因为用 useMediaState 取出来的 TextTrack 对象不会更新渲染
      setTextTrack(textTrackState);
      viewport?.scrollTo({ top: 0 });
    };

    textTrackState.addEventListener('load', onLoad);

    const onUserScroll = () => {
      if (!isAutoScroll()) return;
      setAutoScroll(false);
    };

    viewport?.addEventListener('wheel', onUserScroll);
    viewport?.addEventListener('touchmove', onUserScroll);

    return () => {
      textTrackState.removeEventListener('load', onLoad);

      viewport?.removeEventListener('wheel', onUserScroll);
      viewport?.removeEventListener('touchmove', onUserScroll);
    };
  }, [scrollAreaRef, textTrackState]);

  if (allSubtitles?.length === 0)
    return <div className="w-full my-8 text-center">暂无字幕</div>;

  return (
    <div className="relative">
      <div className="sticky top-0 bg-card w-full z-1 flex items-center justify-between p-2 border-b border-r border-l">
        <SubtitleSelector />
        <Button
          variant="secondary"
          size="icon-sm"
          className="text-sm"
          onClick={handleAutoScrollChange}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={autoScroll ? 'on' : 'off'}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 180 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {autoScroll ? <RefreshCwIcon /> : <RefreshCwOffIcon />}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
      <div className="pt-4 space-y-2">
        {textTrack?.cues.map((cue, index) => {
          const isActive = index === activeCueIndex;
          return (
            <div
              ref={isActive ? targetRef : null}
              data-active={isActive}
              key={cue.text + cue.startTime}
              onClick={() => handleCueClick(cue.startTime)}
              className={cn(
                isActive && 'bg-accent',
                'rounded-sm px-2 py-1 hover:bg-accent/50 transition-colors cursor-pointer'
              )}
            >
              <small className="opacity-60">[{formatTime(cue.startTime)}]</small>
              <p className="text-sm">{cue.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
