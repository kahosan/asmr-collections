import { Separator } from '~/components/ui/separator';

import type { MediaPlayingEvent } from '@vidstack/react';
import { MediaPlayer as VidstackPlayer, MediaProvider, TextTrack, MEDIA_KEY_SHORTCUTS } from '@vidstack/react';

import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { mediaAtom } from '~/hooks/use-media-state';

import { PlayerLayout } from './layout';

import { extractFileExt } from '~/lib/utils';

export default function MediaPlayer() {
  const [mediaState, setMediaState] = useAtom(mediaAtom);

  const subtitleType = extractFileExt(mediaState.currentTrack?.subtitles?.src ?? '') as 'vtt';

  const changeTrack = useCallback((next = false) => {
    const currentIndex = mediaState.tracks?.findIndex(track => track.title === mediaState.currentTrack?.title);
    // index is 0
    if (currentIndex === undefined || currentIndex === -1) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = mediaState.tracks?.at(nextIndex);

    if (!nextTrack) return;
    setMediaState(state => ({ ...state, currentTrack: nextTrack }));
  }, [mediaState.currentTrack?.title, mediaState.tracks, setMediaState]);

  const onPlaying = useCallback((e: MediaPlayingEvent) => {
    if ('mediaSession' in navigator) {
      const currentTrack = mediaState.currentTrack;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack?.title,
        artist: mediaState.work?.artists.map(artist => artist.name).join(', '),
        album: mediaState.work?.name,
        artwork: [
          { src: mediaState.work?.cover ?? '' }
        ]
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => changeTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => changeTrack(true));
    }

    const track = new TextTrack({
      src: mediaState.currentTrack?.subtitles?.src,
      id: mediaState.currentTrack?.title,
      kind: 'subtitles',
      type: subtitleType,
      label: 'Chinese',
      default: true
    });

    e.target.textTracks.clear();
    e.target.textTracks.add(track);
    e.target.textTracks.getById(track.id)?.setMode('showing');
  }, [changeTrack, mediaState.currentTrack, mediaState.work?.artists, mediaState.work?.cover, mediaState.work?.name, subtitleType]);

  if (!mediaState.open) return null;

  return (
    <div className="relative h-16">
      <div className="fixed bottom-0 w-full">
        <Separator />
        <VidstackPlayer
          autoPlay
          src={mediaState.currentTrack?.mediaStreamUrl}
          onPlaying={e => onPlaying(e)}
          onEnded={() => changeTrack(true)}
          keyTarget="document"
          keyShortcuts={MEDIA_KEY_SHORTCUTS}
        >
          <MediaProvider />
          <PlayerLayout
            workId={mediaState.work?.id ?? ''}
            prev={() => changeTrack()}
            next={() => changeTrack(true)}
          />
        </VidstackPlayer>
      </div>
    </div>
  );
}
