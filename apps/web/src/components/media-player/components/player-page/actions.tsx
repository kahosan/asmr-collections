import { Loader2Icon, PauseIcon, PlayIcon, RotateCcwIcon, RotateCwIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';
import { SeekButton, Time, useMediaRemote, useMediaState } from '@vidstack/react';

import { useMediaActions } from '../../context/media-actions';

export default function PlayerPageActions() {
  const actions = useMediaActions();
  const playing = useMediaState('playing');
  const canPlay = useMediaState('canPlay');
  const waiting = useMediaState('waiting');

  const remote = useMediaRemote();

  const handlePlayPause = () => {
    if (!canPlay) return;

    if (playing)
      remote.pause();
    else
      remote.play();
  };

  return (
    <div className="flex items-center h-full gap-4">
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors">
        <SkipBackIcon className="min-max-size-6 cursor-pointer" fill="currentColor" onClick={() => actions?.prevTrack()} />
      </div>
      <SeekButton
        className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors"
        seconds={-10}
      >
        <RotateCcwIcon className="min-max-size-8 cursor-pointer" />
      </SeekButton>
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
            {canPlay && !waiting
              ? (playing
                ? <PauseIcon className="min-max-size-13 cursor-pointer" fill="currentColor" strokeWidth={0} />
                : <PlayIcon className="min-max-size-13 cursor-pointer" fill="currentColor" strokeWidth={0} />)
              : <Loader2Icon className="min-max-size-13 cursor-pointer animate-spin" />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <SeekButton
        className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors"
        seconds={10}
      >
        <RotateCwIcon className="min-max-size-8 cursor-pointer" />
      </SeekButton>
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
