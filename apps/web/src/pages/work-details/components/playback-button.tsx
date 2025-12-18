import { ListVideoIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';

import { AnimatePresence, motion } from 'framer-motion';

import type { Playback } from '@asmr-collections/shared';
import type { Track } from '@asmr-collections/shared';

interface PlaybackButtonProps {
  id: string
  currentPlayWorkId?: string
  playback: Playback | null
  handlePlayback: (track: Track, position: number) => void
}

export function PlaybackButton({ id, currentPlayWorkId, playback, handlePlayback }: PlaybackButtonProps) {
  const show = playback && !(currentPlayWorkId === id);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            className="mb-4 bg-[#EC407A] hover:bg-[#EC407A] hover:opacity-90 text-white"
            onClick={() => handlePlayback(playback.track, playback.position)}
          >
            <ListVideoIcon className="mb-0.5" />
            继续上次播放
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
