import { useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { Image } from '~/components/image';

interface MiddleControlsProps {
  mainExpand?: boolean
}

export function TrackInfo({ mainExpand }: MiddleControlsProps) {
  const mediaState = useAtomValue(mediaStateAtom);

  const title = mediaState.currentTrack?.title;

  // side panel 展开模式下的条件
  const cod = mainExpand === undefined;

  return (
    <div id="track-info" className="flex items-center justify-center gap-2">
      <div id="thumbnail-wrapper" className="size-11 rounded-md overflow-hidden max-sm:block">
        <Image
          disableHidden
          id="thumbnail"
          src={mediaState.work?.cover}
          alt="Thumbnail"
        />
      </div>
      <div id="track-info" className={`flex-1 ${cod ? 'ml-2' : ''}`}>
        <div id="track-title" className="text-sm truncate max-sm:w-42 w-30" title={title}>
          {title || '未知曲目'}
        </div>
        <div id="track-artist" className="opacity-60 text-xs max-sm:w-42 w-30 truncate">
          {mediaState.work?.artists.map(artist => artist.name).join('、') || '未知艺术家'}
        </div>
      </div>
    </div>
  );
};
