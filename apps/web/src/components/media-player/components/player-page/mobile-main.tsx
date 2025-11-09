import { useAtomValue } from 'jotai';
import PlayerPageActions from './actions';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { Volume1Icon, Volume2 } from 'lucide-react';
import { Time, TimeSlider, VolumeSlider } from '@vidstack/react';

export default function PlayerPageMain() {
  const mediaState = useAtomValue(mediaStateAtom);

  const title = mediaState.currentTrack?.title || '未知曲目';
  const workTitle = mediaState.work?.name || '未知作品';

  return (
    <div className="mt-20 w-full">
      <div id="track-info" className="text-center mt-8">
        <div id="track-title" className="font-semibold">
          {title}
        </div>
        <div id="work-title" className="mt-2 text-sm opacity-60">
          {workTitle}
        </div>
      </div>
      <div id="progress-bar" className="mt-4">
        <TimeSlider.Root className="group relative w-full cursor-pointer touch-none select-none items-center outline-none aria-hidden:hidden before:absolute before:inset-0 before:-top-2 before:-bottom-2 before:content-['']">
          <TimeSlider.Preview offset={5} className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-data-[dragging]:opacity-100">
            <TimeSlider.Value className="px-2 py-1 bg-background/80 backdrop-blur-sm text-xs rounded-md border border-border/50" />
          </TimeSlider.Preview>
          <TimeSlider.Track className="relative z-0 h-1 w-full rounded-full bg-foreground/20 transition-colors group-data-[focus]:bg-foreground/25 group-hover:bg-foreground/25">
            <TimeSlider.Progress className="absolute h-full w-[var(--slider-progress)] rounded-sm bg-white/30 will-change-[width]" />
            <TimeSlider.TrackFill className="absolute h-full w-[var(--slider-fill)] rounded-full bg-[linear-gradient(to_right,_#f03_80%,_#ff2791_100%)] will-change-[width]" />
          </TimeSlider.Track>
          <TimeSlider.Thumb className="absolute left-[var(--slider-fill)] top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(to_right,_#f03_80%,_#ff2791_100%)] shadow-lg transition-opacity duration-150 group-data-[dragging]:scale-125 group-data-[dragging]:shadow-xl will-change-[left,transform,opacity]" />
        </TimeSlider.Root>
        <div className="flex items-center justify-between text-sm font-medium opacity-60 mt-2">
          <Time className="time" type="current" />
          <Time className="time" type="duration" />
        </div>
      </div>
      <div id="actions" className="flex justify-center items-center mt-10">
        <PlayerPageActions />
      </div>
      <div id="volume-slider" className="w-full mt-10 flex justify-center items-center gap-2">
        <div className="w-[95%] flex items-center gap-2">
          <Volume1Icon className="min-max-size-6" />
          <VolumeSlider.Root className="group relative mx-[7.5px] h-1 w-full cursor-pointer touch-none select-none items-center outline-none aria-hidden:hidden">
            <VolumeSlider.Track className="relative ring-white z-0 h-1 w-full rounded-sm bg-white/30 group-data-[focus]:ring-[1px]">
              <VolumeSlider.TrackFill className="bg-white/70 absolute h-full w-[var(--slider-fill)] rounded-sm will-change-[width]" />
            </VolumeSlider.Track>
            <VolumeSlider.Thumb className="absolute left-[var(--slider-fill)] top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#cacaca] bg-white ring-white/40 transition-opacity group-data-[dragging]:ring-4 will-change-[left]" />
          </VolumeSlider.Root>
          <Volume2 className="min-max-size-6" />
        </div>
      </div>
    </div>
  );
}
