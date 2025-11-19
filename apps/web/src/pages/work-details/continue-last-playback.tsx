import { AnimatePresence, motion } from 'framer-motion';
import { ListVideoIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { usePlayHistoryValue } from '~/hooks/use-play-history';
import type { Track } from '~/types/tracks';

interface ContinueLastPlaybackProps {
  id: string
  currentPlayWorkId?: string
  handlePlayHistory: (track: Track, lastPlayedAt: number) => void
}

export default function ContinueLastPlayback({ id, currentPlayWorkId, handlePlayHistory }: ContinueLastPlaybackProps) {
  const history = usePlayHistoryValue(id);

  const show = history && !(currentPlayWorkId === id);

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
            onClick={() => handlePlayHistory(history.track, history.lastPlayedAt)}
          >
            <ListVideoIcon className="mb-0.5" />
            继续上次播放
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
