import { useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';

export default function MiddleControls() {
  const mediaState = useAtomValue(mediaStateAtom);

  return (
    <div id="middle-controls" className="flex items-center justify-center gap-2">
      <div id="thumbnail-wrapper" className="w-12 h-12 bg-zinc-800 rounded-md overflow-hidden max-md:hidden max-sm:block">
        <img
          id="thumbnail"
          className="w-full h-full object-cover"
          src={mediaState.work?.cover}
          alt="Thumbnail"
        />
      </div>
      <div id="track-info">
        <div id="track-title" className="font-medium truncate max-sm:w-3/4">
          {mediaState.currentTrack?.title || '未知曲目'}
        </div>
        <div id="track-artist" className="text-sm opacity-60">
          {mediaState.work?.artists.map(artist => artist.name).join('、') || '未知艺术家'}
        </div>
      </div>
    </div>
  );
};
