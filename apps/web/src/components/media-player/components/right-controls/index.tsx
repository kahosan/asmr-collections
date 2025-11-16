import { useMediaRemote, useMediaState, VolumeSlider } from '@vidstack/react';
import { ChevronUp, RepeatIcon, Volume2Icon, VolumeOffIcon } from 'lucide-react';

import { usePlayerExpand } from '../../hooks/use-player-expand';

export default function RightControls() {
  const muted = useMediaState('muted');
  const loop = useMediaState('loop');

  const remote = useMediaRemote();

  const [expand, setExpand] = usePlayerExpand();

  const handleMuteUnmute = () => {
    if (muted)
      remote.unmute();
    else
      remote.mute();
  };

  const handleLoopToggle = () => {
    remote.userPrefersLoopChange(!loop);
  };

  return (
    <div className="flex items-center gap-1 max-sm:hidden">
      <div className="flex items-center gap-4 group/volume">
        <div className="min-w-20 opacity-0 transition-opacity duration-200 group-hover/volume:opacity-100">
          <VolumeSlider.Root className="group relative mx-[7.5px] h-1 w-full cursor-pointer touch-none select-none items-center outline-none aria-hidden:hidden before:absolute before:inset-0 before:-top-2 before:-bottom-2 before:content-['']">
            <VolumeSlider.Track className="relative ring-white z-0 h-1 w-full rounded-sm bg-foreground/20 group-data-focus:ring-[1px]">
              <VolumeSlider.TrackFill className="bg-blue-400 absolute h-full w-(--slider-fill) rounded-sm will-change-[width]" />
            </VolumeSlider.Track>
            <VolumeSlider.Thumb className="absolute left-(--slider-fill) top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#cacaca] bg-white opacity-0 ring-white/40 transition-opacity group-data-active:opacity-100 group-data-dragging:ring-4 will-change-[left]" />
          </VolumeSlider.Root>
        </div>
        <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors cursor-pointer opacity-80" onClick={handleMuteUnmute}>
          {muted
            ? <VolumeOffIcon className="min-max-size-6" />
            : <Volume2Icon className="min-max-size-6" />}
        </div>
      </div>
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors cursor-pointer" onClick={handleLoopToggle}>
        {loop
          ? <RepeatIcon className="min-max-size-6 opacity-100" />
          : <RepeatIcon className="min-max-size-6 opacity-80" />}
      </div>
      <div className="rounded-full p-2 dark:hover:bg-white/15 hover:bg-black/15 transition-colors cursor-pointer" onClick={() => setExpand(p => !p)}>
        <ChevronUp className={`min-max-size-6 transition-transform ${expand ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}
