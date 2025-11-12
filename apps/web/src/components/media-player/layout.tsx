import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useShortcut } from '~/hooks/use-shortcut';
import { usePlayerExpand } from './hooks/use-player-expand';

import { MediaActionsContext } from './context/media-actions';

import PlayerPage from './components/player-page';
import LeftControls from './components/left-controls';
import RightControls from './components/right-controls';
import MiddleControls from './components/middle-controls';
import ProgressSlider from './components/progress-slider';
import FloatingCaptions from './components/floating-captions';
import RightPlayControls from './components/right-controls/right-play';

interface PlayerLayoutProps {
  prev: () => void
  next: () => void
}

export function AudioPlayerLayout({ prev, next }: PlayerLayoutProps) {
  const mediaActions: MediaActionsContext = useMemo(() => ({
    nextTrack: next,
    prevTrack: prev
  }), [next, prev]);

  const [expand, setExpand] = usePlayerExpand();

  const handleClick = () => {
    setExpand(p => !p);
  };

  useShortcut('Escape', () => {
    setExpand(false);
  }, true);

  return (
    <MediaActionsContext value={mediaActions}>
      <PlayerPage />
      <FloatingCaptions />

      <motion.div
        key="desktop-controls"
        className="max-sm:hidden w-full h-20 flex items-center bg-zinc-50 dark:bg-zinc-900 relative z-10"
        onClick={handleClick}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <ProgressSlider onClick={e => e.stopPropagation()} />
        <div className="flex-1 flex pl-4">
          <div onClick={e => e.stopPropagation()}>
            <LeftControls />
          </div>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <MiddleControls />
        </div>
        <div className="flex-1 flex justify-end pr-4">
          <div onClick={e => e.stopPropagation()}>
            <RightControls />
            <RightPlayControls />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {!expand && (
          <motion.div
            key="mobile-controls"
            onClick={handleClick}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="sm:hidden w-full h-15 flex items-center bg-zinc-50 dark:bg-zinc-900 absolute bottom-0 pb-[env(safe-area-inset-bottom)]"
          >
            <ProgressSlider onClick={e => e.stopPropagation()} />
            <div className="flex-1 flex max-sm:hidden pl-4">
              <div onClick={e => e.stopPropagation()}>
                <LeftControls />
              </div>
            </div>
            <div className="max-sm:pl-4">
              <MiddleControls />
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
    </MediaActionsContext>
  );
}
