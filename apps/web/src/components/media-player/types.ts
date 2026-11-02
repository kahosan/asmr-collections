import type { Track } from '@asmr-collections/shared';

type MediaEventHandler = (e: React.SyntheticEvent<HTMLMediaElement>) => void;

export interface MediaProps {
  track?: Track
  subtitleSrc?: string
  prev: () => void
  next: () => void
  onLoadedData: MediaEventHandler
  onTimeUpdate: MediaEventHandler
  onCanPlay: MediaEventHandler
  onEnded: MediaEventHandler
  onPause: MediaEventHandler
  onSeeked: MediaEventHandler
}
