import { Loader2Icon, PauseIcon, PlayIcon, SkipForwardIcon } from 'lucide-react';

import { AnimatePresence, motion } from 'motion/react';

import { usePlayer } from '../../player';

import { useMedia } from '../../context/media';

interface RightPlayControlsProps {
  mainExpand?: boolean
}

export function RightPlayControls({ mainExpand }: RightPlayControlsProps) {
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

  return (
    <div className={`${mainExpand === undefined ? 'hidden' : 'flex'} items-center h-full gap-3 max-sm:flex`}>
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
                ? <PauseIcon className="min-max-size-6 cursor-pointer" fill="currentColor" strokeWidth={0} />
                : <PlayIcon className="min-max-size-6 cursor-pointer" fill="currentColor" />)
              : <Loader2Icon className="min-max-size-6 cursor-pointer animate-spin" />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors">
        <SkipForwardIcon className="min-max-size-6 cursor-pointer" fill="currentColor" onClick={() => actions.nextTrack()} />
      </div>
    </div>
  );
};
