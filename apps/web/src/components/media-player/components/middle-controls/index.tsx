import { Fragment } from 'react';
import { useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { MenuIcon } from 'lucide-react';
import BackToWorkDetails from '../settings-menu/back-to-work-details';

import { Link } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

export default function MiddleControls() {
  const mediaState = useAtomValue(mediaStateAtom);

  const title = mediaState.currentTrack?.title;

  return (
    <div id="middle-controls" className="flex items-center justify-center gap-2">
      <div id="thumbnail-wrapper" className="size-10 bg-zinc-800 rounded-md overflow-hidden max-md:hidden max-sm:block">
        <img
          id="thumbnail"
          className="w-full h-full object-cover"
          src={mediaState.work?.cover}
          alt="Thumbnail"
        />
      </div>
      <div id="track-info" className="flex-1">
        <div id="track-title" className="font-medium truncate max-sm:w-42 max-lg:max-w-48 max-w-70" title={title}>
          {title || '未知曲目'}
        </div>
        <div id="track-artist" className="opacity-60 text-sm max-sm:w-42 max-lg:max-w-48 max-w-70 truncate">
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
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="max-sm:hidden">
            <MenuIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <BackToWorkDetails />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
