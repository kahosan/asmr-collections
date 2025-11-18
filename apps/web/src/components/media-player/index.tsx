import { MediaPlayer as VidstackPlayer, MediaProvider, MEDIA_KEY_SHORTCUTS, TextTrack } from '@vidstack/react';
import type { MediaPlayingEvent } from '@vidstack/react';

import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { mediaStateAtom } from '~/hooks/use-media-state';

import { AudioPlayerLayout } from './layout';
import { fetchTextTrackContent } from './utils';

export default function MediaPlayer() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);

  const changeTrack = useCallback((next = false) => {
    const currentIndex = mediaState.tracks?.findIndex(track => track.title === mediaState.currentTrack?.title);
    // index is 0
    if (currentIndex === undefined || currentIndex === -1) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = mediaState.tracks?.at(nextIndex);

    if (!nextTrack) return;
    setMediaState(state => ({ ...state, currentTrack: nextTrack }));
  }, [mediaState.currentTrack?.title, mediaState.tracks, setMediaState]);

  const onPlaying = useCallback(() => {
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
  }, [changeTrack, mediaState.currentTrack, mediaState.work?.artists, mediaState.work?.cover, mediaState.work?.name]);

  const onLoadStart = useCallback(async (e: MediaPlayingEvent) => {
    const src = mediaState.currentTrack?.subtitles?.url;
    const stateContent = mediaState.currentTrack?.subtitles?.content;

    const content = await fetchTextTrackContent();
    if (!content && !stateContent && !src) return;

    const track = new TextTrack({
      content: content || stateContent,
      id: mediaState.currentTrack?.title,
      kind: 'subtitles',
      label: 'Chinese',
      default: true
    });

    e.target.textTracks.add(track);
    track.setMode('showing');
  }, [mediaState.currentTrack?.subtitles?.content, mediaState.currentTrack?.subtitles?.url, mediaState.currentTrack?.title]);

  if (!mediaState.open) return null;

  return (
    <div className="relative h-15 max-sm:z-10">
      <div className="fixed bottom-0 w-full">
        <VidstackPlayer
          autoPlay
          src={mediaState.currentTrack?.mediaStreamUrl}
          onLoadStart={onLoadStart}
          onPlaying={onPlaying}
          onEnded={() => changeTrack(true)}
          keyTarget="document"
          keyShortcuts={MEDIA_KEY_SHORTCUTS}
        >
          <MediaProvider />
          <AudioPlayerLayout
            prev={() => changeTrack()}
            next={() => changeTrack(true)}
          />
        </VidstackPlayer>
      </div>
    </div>
  );
}
