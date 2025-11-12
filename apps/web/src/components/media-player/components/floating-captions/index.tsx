import { useMediaState } from '@vidstack/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '~/lib/utils';

export default function FloatingCaptions() {
  const textTrackState = useMediaState('textTrack');

  const [activeCue, setActiveCue] = useState<VTTCue>();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const captionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textTrackState) return;

    const onCueChange = () => {
      const cues = textTrackState.activeCues;
      let first: VTTCue | undefined;
      if (cues.at(0))
        first = cues.at(0) as VTTCue;

      setActiveCue(p => first || p);
    };

    const onLoad = () => {
      const cues = textTrackState.cues;
      const cue = cues.at(0) as VTTCue | undefined;
      setActiveCue(cue);
    };

    textTrackState.addEventListener('load', onLoad);
    textTrackState.addEventListener('cue-change', onCueChange);

    return () => {
      textTrackState.removeEventListener('load', onLoad);
      textTrackState.removeEventListener('cue-change', onCueChange);
    };
  }, [textTrackState]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setDragStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  return (
    <div
      ref={captionRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'relative',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div
        id="floating-captions"
        className={cn(
          'bg-gray-400/60 text-blue-600 dark:bg-accent/70 dark:text-blue-400',
          'rounded-sm min-w-full text-center min-h-8 px-4 py-1',
          'text-xl touch-none',
          'flex flex-wrap items-center justify-center',
          'absolute bottom-20'
        )}
      >
        <span>{activeCue?.text}</span>
      </div>
    </div>
  );
}
