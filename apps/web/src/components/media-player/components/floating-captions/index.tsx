import { useAtomValue } from 'jotai';
import { Activity, useCallback, useEffect, useRef, useState } from 'react';

import { useActiveCue } from '../../hooks/use-active-cue';
import { floatingCaptionsOpenAtom } from '../../hooks/use-floating-open';

import { cn } from '~/lib/utils';

export default function FloatingCaptions() {
  const open = useAtomValue(floatingCaptionsOpenAtom);

  const { activeCue, textTrackState } = useActiveCue();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startX: clientX - position.x,
      startY: clientY - position.y
    };
  }, [position.x, position.y]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDragging) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setPosition({
        x: clientX - dragRef.current.startX,
        y: clientY - dragRef.current.startY
      });
    }
  }, [isDragging]);

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [handleMove, isDragging]);

  if (!textTrackState) return null;

  return (
    <Activity mode={open ? 'visible' : 'hidden'}>
      <div
        style={{
          position: 'fixed',
          left: 0,
          bottom: 100,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        className="select-none z-5"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div
          id="floating-captions"
          className={cn(
            'bg-gray-400/60 text-blue-600 dark:bg-accent/70 dark:text-blue-400 backdrop-blur-md',
            'rounded-sm min-w-dvw text-center min-h-8 px-4 py-1',
            'text-xl touch-none',
            'flex flex-wrap items-center justify-center'
          )}
        >
          <span>{activeCue?.text}</span>
        </div>
      </div>
    </Activity>
  );
}
