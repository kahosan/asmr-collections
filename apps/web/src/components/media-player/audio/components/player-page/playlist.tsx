import { GripVerticalIcon, X } from 'lucide-react';
import { Button } from '~/components/ui/button';

import { useAtom } from 'jotai';
import { motion } from 'motion/react';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { arrayMove } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable, isSortable } from '@dnd-kit/react/sortable';

import { cn } from '~/lib/utils';

import type { Track } from '@asmr-collections/shared';

export function Playlist() {
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

  if (!tracks || tracks.length === 0)
    return <div className="w-full my-8 text-center">暂无曲目</div>;

  return (
    <div className="mt-4">
      <DragDropProvider
        onDragEnd={e => {
          if (isSortable(e.operation.source)) {
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
            tracks.map((track, index) => (
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
  const { handleRef, ref, isDragging } = useSortable({ id: track.title, index });

  const isActive = current?.title === track.title;
  const activeClass = isActive ? 'text-white' : 'text-black dark:text-white';

  return (
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-center',
        'px-2 py-1 text-sm mb-2 rounded-sm transition-colors',
        'hover:bg-accent cursor-pointer',
        isActive && 'bg-blue-500 text-white hover:bg-blue-500',
        isDragging && !isActive && 'bg-accent'
      )}
      title={track.title}
      onClick={onChange}
    >
      <Button
        ref={handleRef}
        type="button"
        variant="link"
        size="icon-sm"
        className="cursor-grab"
      >
        <GripVerticalIcon className={activeClass} />
      </Button>
      <p className="truncate">{track.title}</p>
      <Button
        type="button"
        variant="link"
        size="icon-sm"
        onClick={e => {
          e.stopPropagation();
          removeTrack();
        }}
      >
        <X className={activeClass} />
      </Button>
    </div>
  );
}
