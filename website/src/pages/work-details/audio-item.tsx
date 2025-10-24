import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from '~/components/ui/context-menu';

import { FileMusic } from 'lucide-react';

import type { MediaTrack } from '~/hooks/use-media-state';

interface AudioItemProps {
  existCurrentTrack?: boolean
  track: MediaTrack
  onPlay: () => void
  enqueueTrack: (track: MediaTrack) => void
}

export default function AudioItem({ existCurrentTrack, track, onPlay, enqueueTrack }: AudioItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex gap-3 items-center p-3 w-full cursor-pointer" onClick={onPlay} title={track.title}>
        <FileMusic className="min-size-7" color="#4083e7" />
        <p className="line-clamp-2">{track.title}</p>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>操作</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onPlay}>播放</ContextMenuItem>
        <ContextMenuItem disabled={!existCurrentTrack} onClick={() => enqueueTrack(track)}>添加到播放列表</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
