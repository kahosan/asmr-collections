import { TimeSlider } from '@videojs/react';

export function ProgressSlider({ ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="absolute top-0 w-full" {...rest}>
      <TimeSlider.Root className="group relative w-full cursor-pointer touch-none select-none items-center outline-none before:absolute before:inset-0 before:-top-2 before:-bottom-2 before:content-[''] max-sm:pointer-events-none">
        <TimeSlider.Preview className="bottom-full mb-1.5 opacity-0 transition-opacity duration-150 group-data-pointing:opacity-100 group-data-dragging:opacity-100">
          <TimeSlider.Value type="pointer" className="block px-2 py-1 bg-background/80 backdrop-blur-sm text-xs rounded-md border border-border/50" />
        </TimeSlider.Preview>
        <TimeSlider.Track className="relative z-0 h-0.5 w-full rounded-full bg-foreground/20 transition-colors group-data-interactive:bg-foreground/25 group-hover:bg-foreground/25 group-hover:h-1">
          <TimeSlider.Buffer className="absolute h-full w-(--media-slider-buffer) rounded-sm bg-white/30 will-change-[width]" />
          <TimeSlider.Fill className="absolute h-full w-(--media-slider-fill) rounded-full bg-[linear-gradient(to_right,_#f03_80%,_#ff2791_100%)] will-change-[width]" />
        </TimeSlider.Track>
        <TimeSlider.Thumb className="absolute left-(--media-slider-fill) top-1/2 z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(to_right,_#f03_80%,_#ff2791_100%)] opacity-0 shadow-lg transition-opacity duration-150 group-data-interactive:opacity-100 group-data-dragging:scale-125 group-data-dragging:shadow-xl group-hover:opacity-100 will-change-[left,transform,opacity]" />
      </TimeSlider.Root>
    </div>
  );
};
