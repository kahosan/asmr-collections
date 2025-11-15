import { X } from 'lucide-react';
import { Button } from '~/components/ui/button';

import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable, isSortable } from '@dnd-kit/react/sortable';

import { cn } from '~/lib/utils';
import type { Track } from '~/types/tracks';

export default function Playlist() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);

  const current = mediaState.currentTrack;
  const tracks = mediaState.tracks;

  const onChange = (title: string) => {
    const track = tracks?.find(track => track.title === title);
    if (track) setMediaState({ ...mediaState, currentTrack: track });
  };

  const removeTrack = (track: Track) => {
    const newTracks = tracks?.filter(t => t.title !== track.title);
    setMediaState({ ...mediaState, tracks: newTracks });
  };

  if (tracks?.length === 0)
    return <div className="w-full my-8 text-center">暂无曲目</div>;

  return (
    <div className="mt-4">
      <DragDropProvider
        onDragEnd={e => {
          if (isSortable(e.operation.source) && tracks) {
            const oldIndex = e.operation.source.sortable.initialIndex;
            const newIndex = e.operation.source.sortable.index;
            const newTracks = arrayMove(tracks, oldIndex, newIndex);
            setMediaState({ ...mediaState, tracks: newTracks });
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {
            tracks?.map((track, index) => (
              <SortableItem
                key={track.title}
                current={current}
                onChange={() => onChange(track.title)}
                track={track}
                index={index}
                removeTrack={() => removeTrack(track)}
              />
            ))
          }
        </motion.div>
      </DragDropProvider>
    </div>
  );
}

function SortableItem(props: { current?: Track, track: Track, index: number, onChange: () => void, removeTrack: () => void }) {
  const { current, track, index, onChange, removeTrack } = props;
  const { ref, isDragging } = useSortable({ id: track.title, index });

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between px-2 py-1 text-sm mb-2 rounded-sm hover:bg-accent/50 transition-colors',
        isDragging && 'bg-accent',
        current?.title === track.title && 'bg-accent'
      )}
      title={track.title}
      onClick={onChange}
    >
      <div className="max-w-64 truncate">
        {track.title}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={e => {
          e.stopPropagation();
          removeTrack();
        }}
      >
        <X />
      </Button>
    </div>

  );
}
