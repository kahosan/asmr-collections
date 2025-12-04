import { X } from 'lucide-react';
import { Button } from '~/components/ui/button';

import { useAtom } from 'jotai';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

import { mediaStateAtom } from '~/hooks/use-media-state';

import { cn } from '~/lib/utils';

import type { Track } from '@asmr-collections/shared';

// TODO: 等 dnd-kit 支持 React 的 ViewTransition API 后，改用 dnd-kit 实现
export default function Playlist() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);

  const current = mediaState.currentTrack;
  const tracks = mediaState.tracks;

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const onChange = (title: string) => {
    const track = tracks?.find(track => track.title === title);
    if (track) setMediaState({ ...mediaState, currentTrack: track });
  };

  const removeTrack = (track: Track) => {
    const newTracks = tracks?.filter(t => t.title !== track.title);
    setMediaState({ ...mediaState, tracks: newTracks });
  };

  const handleSort = () => {
    const _items = structuredClone(tracks || []);

    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const draggedItemContent = _items[dragItem.current];
    _items.splice(dragItem.current, 1);
    _items.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = dragOverItem.current;

    setMediaState({ ...mediaState, tracks: _items });
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  if (tracks?.length === 0)
    return <div className="w-full my-8 text-center">暂无曲目</div>;

  return (
    <div className="mt-4 flex flex-col">
      {tracks?.map((track, index) => (
        <PlaylistItem
          key={track.title}
          track={track}
          current={current}
          onChange={() => onChange(track.title)}
          removeTrack={() => removeTrack(track)}

          onDragStart={() => {
            dragItem.current = index;
          }}
          onDragEnter={() => {
            dragOverItem.current = index;
            handleSort();
          }}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}

function PlaylistItem(props: {
  track: Track
  current?: Track
  onChange: () => void
  removeTrack: () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
}) {
  const { track, current, onChange, removeTrack, onDragStart, onDragEnter, onDragEnd } = props;
  const isActive = current?.title === track.title;

  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      layout
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      draggable
      onDragStart={() => {
        setIsDragging(true);
        onDragStart();
      }}
      onDragEnter={() => {
        onDragEnter();
      }}
      onDragOver={e => {
        e.preventDefault();
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={cn(
        'flex items-center justify-between px-2 py-1 text-sm mb-2 rounded-sm cursor-pointer active:cursor-grabbing',
        'hover:bg-accent',
        isActive && 'bg-blue-500 text-white hover:bg-blue-500',
        isDragging && !isActive && 'border border-dashed opacity-50 bg-accent'
      )}
      onClick={onChange}
    >
      <div className="max-w-64 sm:max-w-60.5 truncate select-none pointer-events-none">
        {track.title}
      </div>
      <Button
        type="button"
        variant="link"
        size="icon-sm"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          removeTrack();
        }}
      >
        <X className={isActive ? 'text-white' : 'text-black dark:text-white'} />
      </Button>
    </motion.div>
  );
}
