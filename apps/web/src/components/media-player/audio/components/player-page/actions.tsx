import { Loader2Icon, PauseIcon, PlayIcon, RotateCcwIcon, RotateCwIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react';

import { AnimatePresence, motion } from 'motion/react';
import { SeekButton } from '@videojs/react';

import { usePlayer } from '../../player';

import { useMedia } from '../../context/media';

export function PlayerPageActions() {
  const { actions } = useMedia();
  const playing = usePlayer(s => !s.paused);
  const canPlay = usePlayer(s => s.canPlay);
  const waiting = usePlayer(s => s.waiting);

  const player = usePlayer();

  const handlePlayPause = () => {
    if (!canPlay) return;

    if (playing)
      player.pause();
    else
      player.play();
  };

  const playIconClass = 'min-max-size-13 sm:min-max-size-10 cursor-pointer';
  const rotateIconClass = 'min-max-size-8 sm:min-max-size-7 cursor-pointer';

  return (
    <div className="flex items-center h-full sm:gap-2 gap-4">
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors">
        <SkipBackIcon className="min-max-size-6 cursor-pointer" fill="currentColor" onClick={() => actions.prevTrack()} />
      </div>
      <SeekButton
        className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors"
        seconds={-10}
      >
        <RotateCcwIcon className={rotateIconClass} />
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
                ? <PauseIcon className={playIconClass} fill="currentColor" strokeWidth={0} />
                : <PlayIcon className={playIconClass} fill="currentColor" strokeWidth={0} />)
              : <Loader2Icon className={`${playIconClass} animate-spin`} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <SeekButton
        className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors"
        seconds={10}
      >
        <RotateCwIcon className={rotateIconClass} />
      </SeekButton>
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors">
        <SkipForwardIcon className="min-max-size-6 cursor-pointer" fill="currentColor" onClick={() => actions.nextTrack()} />
      </div>
    </div>
  );
};
