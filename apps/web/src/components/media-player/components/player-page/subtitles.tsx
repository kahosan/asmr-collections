import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { TextTrack } from '@vidstack/react';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '~/components/ui/button';
import SubtitleSelector from './subtitle-selector';
import { RefreshCwIcon, RefreshCwOffIcon } from 'lucide-react';

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

interface SubtitlesProps {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
}

export default function Subtitles({ scrollAreaRef }: SubtitlesProps) {
  const remote = useMediaRemote();
  const textTrackState = useMediaState('textTrack');
  const currentTime = useMediaState('currentTime');
  const targetRef = useRef<HTMLDivElement>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(autoScroll);

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

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
    remote.seek(startTime);
  };

  useEffect(() => {
    if (!textTrackState) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');

    const handleScroll = () => {
      if (viewport && activeCueIndex) {
        if (!autoScrollRef.current || !targetRef.current) return;
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const onLoad = () => {
      // 为什么要自建一个 state，因为用 useMediaState 取出来的 TextTrack 对象不会更新渲染
      setTextTrack(textTrackState);
      viewport?.scrollTo({ top: 0 });
    };

    textTrackState.addEventListener('load', onLoad);

    const onUserScroll = () => {
      if (!autoScrollRef.current) return;
      setAutoScroll(false);
    };

    // 当活动 cue 变化时滚动
    handleScroll();

    viewport?.addEventListener('wheel', onUserScroll);
    viewport?.addEventListener('touchmove', onUserScroll);

    return () => {
      textTrackState.removeEventListener('load', onLoad);

      viewport?.removeEventListener('wheel', onUserScroll);
      viewport?.removeEventListener('touchmove', onUserScroll);
    };
  }, [textTrackState, scrollAreaRef, activeCueIndex]);

  if (!textTrack)
    return <div className="w-full my-8 text-center">暂无字幕</div>;

  return (
    <div className="relative">
      <div className="sticky top-0 bg-card w-full z-1 flex items-center justify-between p-2 border-b border-r border-l">
        <SubtitleSelector />
        <Button
          variant="secondary"
          size="icon-sm"
          className="text-sm"
          onClick={() => setAutoScroll(!autoScroll)}
        >
          {autoScroll ? <RefreshCwIcon /> : <RefreshCwOffIcon />}
        </Button>
      </div>
      <div className="pt-4 space-y-2">
        {textTrack.cues.map((cue, index) => {
          const isActive = index === activeCueIndex;
          return (
            <div
              ref={isActive ? targetRef : null}
              data-active={isActive}
              key={cue.id}
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
