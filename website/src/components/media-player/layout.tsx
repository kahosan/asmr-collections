import { DefaultAudioLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/audio.css';

import { Button } from '../ui/button';

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

import SettingsMenu from './settings-menu';

import { CircleX, ListMusic, StepBack, StepForward } from 'lucide-react';

import { useAtom } from 'jotai';
import { useTheme } from 'next-themes';

import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { arrayMove } from '@dnd-kit/helpers';

import { mediaAtom } from '~/hooks/use-media-state';

import { cn } from '~/lib/utils';

import type { Track } from '~/types/tracks';

interface PlayerLayoutProps {
  workId: string
  prev: () => void
  next: () => void
}

export function PlayerLayout({ workId, prev, next }: PlayerLayoutProps) {
  const { theme } = useTheme();

  return (
    <div className="w-full">
      <DefaultAudioLayout
        colorScheme={theme as 'light' | 'dark' | 'system' | undefined}
        icons={defaultLayoutIcons}
        slots={{
          beforeSeekBackwardButton: <StepBack onClick={prev} className="cursor-pointer shrink-0 size-4 mx-1 max-md:hidden" />,
          afterSeekForwardButton: <StepForward onClick={next} className="cursor-pointer shrink-0 size-4 mx-1 max-md:hidden" />,
          afterCaptionButton: <MediaQueue />,
          afterSettingsMenuItemsEnd: <SettingsMenu workId={workId} />
        }}
        style={{
          paddingLeft: '0.85rem',
          '--audio-time-font-size': '0.88rem',
          '--media-button-icon-size': '25px'
        }}
      />
    </div>
  );
}

function MediaQueue() {
  const [mediaState, setMediaState] = useAtom(mediaAtom);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="vds-button">
          <ListMusic className="max-size-6 vds-icon" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-sm">
        <DropdownMenuLabel>选择曲目<small className="opacity-65">（可拖动）</small></DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tracks?.length === 0 && <div className="w-full my-8 text-center">暂无曲目</div>}
        <DropdownMenuRadioGroup value={current?.title} onValueChange={onChange}>
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
            {
              tracks?.map((track, index) => (
                <SortableItem
                  key={track.title}
                  track={track}
                  index={index}
                  removeTrack={() => removeTrack(track)}
                />
              ))
            }
          </DragDropProvider>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortableItem(props: { track: Track, index: number, removeTrack: () => void }) {
  const { track, index, removeTrack } = props;
  const { ref, isDragging } = useSortable({ id: track.title, index });

  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-between rounded-md', isDragging && 'bg-accent')}
      title={track.title}
    >
      <DropdownMenuRadioItem
        className="flex-1"
        value={track.title}
      >
        <div className="max-w-64 truncate">
          {track.title}
        </div>
      </DropdownMenuRadioItem>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={removeTrack}
      >
        <CircleX />
      </Button>
    </div>

  );
}
