import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';
import { Time, useMediaRemote, useMediaState } from '@vidstack/react';

import { useMediaActions } from '../../context/media-actions';

export default function LeftControls() {
  const actions = useMediaActions();
  const playing = useMediaState('playing');

  const remote = useMediaRemote();

  const handlePlayPause = () => {
    if (playing)
      remote.pause();
    else
      remote.play();
  };

  return (
    <div className="flex items-center h-full gap-1">
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors">
        <SkipBackIcon className="min-max-size-6 cursor-pointer" fill="currentColor" onClick={() => actions?.prevTrack()} />
      </div>
      <motion.div
        className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors"
        onClick={handlePlayPause}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={playing ? 'pause' : 'play'}
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.1, ease: 'easeInOut' }}
          >
            {playing
              ? <PauseIcon className="min-max-size-9 cursor-pointer" fill="currentColor" />
              : <PlayIcon className="min-max-size-9 cursor-pointer" fill="currentColor" />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors">
        <SkipForwardIcon className="min-max-size-6 cursor-pointer" fill="currentColor" onClick={() => actions?.nextTrack()} />
      </div>
      <div className="flex items-center text-xs font-medium opacity-60 max-md:hidden">
        <Time className="time" type="current" />
        <div className="mx-1">/</div>
        <Time className="time" type="duration" />
      </div>
    </div>
  );
};
