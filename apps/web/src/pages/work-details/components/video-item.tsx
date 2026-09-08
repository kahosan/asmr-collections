import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '~/components/ui/dialog';

import { FileVideo } from 'lucide-react';

import { useCallback, useState } from 'react';

import { formatDuration } from '@asmr-collections/shared';

import type { Work, Track, Tracks } from '@asmr-collections/shared';

interface VideoItemProps {
  track: Track
  tracks?: Tracks
  work?: Work
}

export function VideoItem({ track, tracks, work }: VideoItemProps) {
  const [currentTrack, setCurrentTrack] = useState(() => track);

  const changeTrack = useCallback((next = false) => {
    const currentIndex = tracks?.findIndex(track => track.title === currentTrack.title);

    if (!currentIndex && currentIndex !== 0) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = tracks?.at(nextIndex);

    if (nextTrack) setCurrentTrack(nextTrack);
  }, [currentTrack.title, tracks]);

  const updateMediaMetadata = useCallback(() => {
    if (
      !('mediaSession' in navigator)
      || !work
    ) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: work.artists.map(artist => artist.name).join(', '),
      album: work.name,
      artwork: [
        { src: work.cover, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => changeTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => changeTrack(true));
  }, [changeTrack, currentTrack.title, work]);

  return (
    <Dialog>
      <DialogTrigger className="flex items-center w-full py-1 text-start" title={track.title}>
        <FileVideo className="min-size-8 mx-4" color="#4B60D7" />
        <div>
          <p className="line-clamp-2">{track.title}</p>
          {track.duration ? <small className="opacity-70">{formatDuration(track.duration)}</small> : null}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" onInteractOutside={e => e.preventDefault()}>
        <DialogTitle className="text-base truncate w-8/9" title={currentTrack.title}>
          {currentTrack.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          视频播放器
        </DialogDescription>
        <video
          controls
          src={currentTrack.mediaDownloadUrl}
          className="rounded-sm w-full h-auto block"
          onCanPlay={updateMediaMetadata}
        />
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => changeTrack()}>上一个</Button>
          <Button variant="outline" onClick={() => changeTrack(true)}>下一个</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
