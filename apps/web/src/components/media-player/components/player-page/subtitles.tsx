import { useMediaContext, useMediaRemote, useMediaState } from '@vidstack/react';

import { useEffect, useEffectEvent, useState } from 'react';

import { focusAtom } from 'jotai-optics';
import { useAtomValue } from 'jotai/react';
import { motion, AnimatePresence } from 'framer-motion';

import { mediaStateAtom } from '~/hooks/use-media-state';

import { Button } from '~/components/ui/button';
import { RefreshCwIcon, RefreshCwOffIcon } from 'lucide-react';

import SubtitleSelector from './subtitle-selector';

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
  const media = useMediaContext();
  const textTrack = useMediaState('textTrack');

  const [autoScroll, setAutoScroll] = useState(true);
  const [activeCue, setActiveCue] = useState<VTTCue | null>(null);
  const [loaded, setLoaded] = useState('');

  const allSubtitles = useAtomValue(allSubtitlesAtom);

  const currentTime = media.$state.currentTime();

  const handleCueClick = (startTime: number) => {
    remote.seek(startTime + 0.5);
  };

  const handleAutoScrollChange = () => {
    setAutoScroll(p => !p);
  };

  useEffect(() => {
    if (!textTrack) return;

    const onCueChange = () => {
      const cues = textTrack.activeCues;
      const cue = cues.at(0) as VTTCue | undefined;
      if (cue) setActiveCue(cue);
    };

    const onLoad = () => {
      setLoaded(textTrack.id);
    };

    textTrack.addEventListener('load', onLoad);
    textTrack.addEventListener('cue-change', onCueChange);

    return () => {
      textTrack.removeEventListener('load', onLoad);
      textTrack.removeEventListener('cue-change', onCueChange);
    };
  }, [textTrack]);

  const isAutoScroll = useEffectEvent(() => autoScroll);
  const getViewport = useEffectEvent(() => {
    return scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') ?? null;
  });

  useEffect(() => {
    const viewport = getViewport();

    // TODO: 当惯性滚动时 点击自动滚动切换按钮，会把 autoScroll 重置为 false 导致切换失败
    const onUserScroll = () => {
      if (!isAutoScroll()) return;
      setAutoScroll(false);
    };

    viewport?.addEventListener('wheel', onUserScroll);
    viewport?.addEventListener('touchmove', onUserScroll);

    return () => {
      viewport?.removeEventListener('wheel', onUserScroll);
      viewport?.removeEventListener('touchmove', onUserScroll);
    };
  }, []);

  if (allSubtitles?.length === 0)
    return <div className="w-full my-8 text-center">暂无字幕</div>;

  return (
    <div className="relative">
      <div className="sticky top-0 bg-card w-full z-1 flex items-center justify-between p-2 border-b border-r border-l rounded-b-lg">
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-4 space-y-2"
        key={loaded}
      >
        {textTrack?.cues.map((cue, index, arr) => {
          let isActive = false;
          if (activeCue) {
            isActive = cue.startTime === activeCue.startTime;
          } else {
            isActive = cue.startTime <= currentTime && cue.endTime >= currentTime;
            const nextCue = arr.at(index + 1);
            if (!isActive && nextCue) {
              // 处理当前时间在两个 cue 之间的情况
              isActive = cue.endTime < currentTime && nextCue.startTime > currentTime;
            }
          }

          return (
            <div
              ref={el => {
                if (!el || !isActive || !autoScroll) return;
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              data-active={isActive}
              key={cue.text + cue.startTime}
              onClick={() => handleCueClick(cue.startTime)}
              className={cn(
                'hover:bg-accent',
                isActive && 'bg-[#7b1fa2] text-white hover:bg-[#7b1fa2]',
                'rounded-sm px-2 py-1 transition-colors cursor-pointer'
              )}
            >
              <small className="opacity-60">[{formatTime(cue.startTime)}]</small>
              <p className="text-sm">{cue.text}</p>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};
