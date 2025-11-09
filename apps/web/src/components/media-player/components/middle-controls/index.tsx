import { useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { MenuIcon } from 'lucide-react';
import BackToWorkDetails from '../settings-menu/back-to-work-details';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

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
        <div id="track-title" className="font-medium truncate text-sm max-sm:w-3/4">
          {mediaState.currentTrack?.title || '未知曲目'}
        </div>
        <div id="track-artist" className="text-xs opacity-60">
          {mediaState.work?.artists.map(artist => artist.name).join('、') || '未知艺术家'}
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
