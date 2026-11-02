import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from '~/components/ui/context-menu';

import { FileMusic, FileVideo } from 'lucide-react';

import { formatDuration } from '@asmr-collections/shared';

import type { Track } from '@asmr-collections/shared';

interface MediaItemProps {
  track: Track
  onPlay: () => void
  enqueueTrack: (track: Track) => void
  disableEnqueue: boolean
  isVideo?: boolean
}

export function MediaItem({ disableEnqueue, track, onPlay, enqueueTrack, isVideo }: MediaItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex items-center py-1 w-full cursor-pointer select-none" onClick={onPlay} title={track.title}>
        {isVideo
          ? <FileVideo className="min-size-8 mx-4" color="#4B60D7" />
          : <FileMusic className="min-size-8 mx-4" color="#4083e7" />}
        <div>
          <p className="line-clamp-2">{track.title}</p>
          {track.duration ? <small className="opacity-70">{formatDuration(track.duration)}</small> : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>操作</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onPlay}>播放</ContextMenuItem>
        <ContextMenuItem disabled={disableEnqueue} onClick={() => enqueueTrack(track)}>添加到播放列表</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
