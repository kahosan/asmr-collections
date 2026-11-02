import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useShortcut } from '~/hooks/use-shortcut';
import { usePlayerExpand } from './hooks/use-player-expand';

import { MediaContext } from './context/media';

import { TrackInfo } from './components/track-info';
import { MediaContainer } from './components/media-container';
import { PlayerPage } from './components/player-page';
import { PipCaptions } from './components/pip-captions';
import { LeftControls } from './components/left-controls';
import { RightControls } from './components/right-controls';
import { ProgressSlider } from './components/progress-slider';
import { FloatingCaptions } from './components/floating-captions';
import { RightPlayControls } from './components/right-controls/right-play';

interface PlayerLayoutProps {
  isTranscoded: boolean
  loop: boolean
  toggleLoop: () => void
  prev: () => void
  next: () => void
  children: React.ReactNode
}

export function AudioPlayerLayout({ prev, next, isTranscoded, loop, toggleLoop, children }: PlayerLayoutProps) {
  const initialValue: MediaContext = useMemo(() => ({
    isTranscoded,
    loop,
    actions: {
      nextTrack: next,
      prevTrack: prev,
      toggleLoop
    }
  }), [isTranscoded, loop, next, prev, toggleLoop]);

  const [expand, setExpand] = usePlayerExpand();

  const handleClick = () => {
    setExpand(p => !p);
  };

  useShortcut('Escape', () => {
    setExpand(false);
  }, true);

  return (
    <MediaContext value={initialValue}>
      <MediaContainer>
        {children}
      </MediaContainer>

      <PlayerPage />
      <FloatingCaptions />
      <PipCaptions />

      <AnimatePresence>
        {!expand && (
          <motion.div
            key="controls"
            onClick={handleClick}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-15 flex items-center bg-zinc-50 dark:bg-zinc-900 absolute bottom-0 pb-[env(safe-area-inset-bottom)]"
          >
            <ProgressSlider onClick={e => e.stopPropagation()} />
            <div className="flex-1 flex pl-4 max-sm:hidden">
              <div onClick={e => e.stopPropagation()}>
                <LeftControls />
              </div>
            </div>
            <div className="pl-2 sm:hidden">
              <TrackInfo />
            </div>
            <div className="flex-1 flex justify-end pr-4">
              <div onClick={e => e.stopPropagation()}>
                <RightControls />
                <RightPlayControls />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MediaContext>
  );
}
