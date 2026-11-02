import type { Track } from '@asmr-collections/shared';

type MediaEventHandler = (e: React.SyntheticEvent<HTMLMediaElement>) => void;

/**
 * media-player 外壳传给 audio / video 播放器的公共数据和回调
 */
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
