import { Fragment } from 'react';
import { useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { Link } from '@tanstack/react-router';
import { cn } from '~/lib/utils';

interface MiddleControlsProps {
  mainExpand?: boolean
}

export default function TrackInfo({ mainExpand }: MiddleControlsProps) {
  const mediaState = useAtomValue(mediaStateAtom);

  const title = mediaState.currentTrack?.title;

  // side panel 展开模式下的条件
  const cod = mainExpand === undefined;

  return (
    <div id="track-info" className="flex items-center justify-center gap-2">
      <div id="thumbnail-wrapper" className={cn('size-11 bg-zinc-800 rounded-md overflow-hidden max-md:hidden max-sm:block', cod ? '' : 'ml-3')}>
        <img
          id="thumbnail"
          className="w-full h-full object-cover"
          src={mediaState.work?.cover}
          alt="Thumbnail"
        />
      </div>
      <div id="track-info" className={`flex-1 ${cod ? 'ml-2' : ''}`}>
        <div id="track-title" className="text-sm truncate max-sm:w-42 w-30" title={title}>
          {title || '未知曲目'}
        </div>
        <div id="track-artist" className="opacity-60 text-xs max-sm:w-42 w-30 truncate">
          {mediaState.work?.artists.map((artist, index, array) => (
            <Fragment key={artist.name}>
              <Link
                to="/"
                search={{ artistId: [artist.id] }}
                disabled={!artist.id}
                className="hover:underline underline-offset-4 mr-1 max-sm:pointer-events-none"
              >
                {artist.name}
              </Link>
              {index < array.length - 1 && '、'}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
