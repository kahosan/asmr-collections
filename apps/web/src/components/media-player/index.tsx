import { MediaPlayer as VidstackPlayer, MediaProvider, MEDIA_KEY_SHORTCUTS, TextTrack } from '@vidstack/react';
import type { MediaLoadedDataEvent, MediaPlayerInstance, MediaPlayingEvent, MediaTimeUpdateEventDetail } from '@vidstack/react';

import { useAtom } from 'jotai';
import { useCallback, useRef } from 'react';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { usePlayHistoryUpdate } from '~/hooks/use-play-history';

import { AudioPlayerLayout } from './layout';
import { fetchTextTrackContent } from './utils';

export default function MediaPlayer() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);
  const updateHistory = usePlayHistoryUpdate();

  const saveTimeRef = useRef<number | null>(null);

  const changeTrack = useCallback((next = false) => {
    const currentIndex = mediaState.tracks?.findIndex(track => track.title === mediaState.currentTrack?.title);
    // index is 0
    if (currentIndex === undefined || currentIndex === -1) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = mediaState.tracks?.at(nextIndex);

    if (!nextTrack || nextIndex < 0) return;
    setMediaState(prev => ({ ...prev, currentTrack: nextTrack }));
  }, [mediaState.currentTrack?.title, mediaState.tracks, setMediaState]);

  const onLoadStart = useCallback(async (e: MediaPlayingEvent) => {
    // 清理已存在的字幕轨道
    e.target.textTracks.clear();

    const src = mediaState.currentTrack?.subtitles?.url;
    const stateContent = mediaState.currentTrack?.subtitles?.content;

    const content = await fetchTextTrackContent(src);
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

  const onEnded = useCallback(() => {
    changeTrack(true);

    if (!mediaState.work || !mediaState.currentTrack) return;

    if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
    updateHistory(mediaState.work.id, -1, mediaState.currentTrack);
  }, [changeTrack, mediaState.currentTrack, mediaState.work, updateHistory]);

  const onLoadedData = useCallback((e: MediaLoadedDataEvent) => {
    if (mediaState.currentTrack?.lastPlayedAt)
      e.target.currentTime = mediaState.currentTrack.lastPlayedAt;
  }, [mediaState.currentTrack]);

  const onTimeUpdate = useCallback((detail: MediaTimeUpdateEventDetail) => {
    if (saveTimeRef.current) return;

    const currentTime = detail.currentTime;

    saveTimeRef.current = window.setTimeout(() => {
      if (!mediaState.work || !mediaState.currentTrack) return;
      updateHistory(mediaState.work.id, currentTime, mediaState.currentTrack);
      saveTimeRef.current = null;
    }, 2000);
  }, [mediaState.currentTrack, mediaState.work, updateHistory]);

  const setupMediaSession = useCallback((el: MediaPlayerInstance | null) => {
    if (!el) return;

    const unsubscribe = el.subscribe(state => {
      if (
        !('mediaSession' in navigator)
        || !mediaState.currentTrack
        || !mediaState.work
        || !state.canPlay
      ) return;

      const currentTrack = mediaState.currentTrack;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: mediaState.work.artists.map(artist => artist.name).join(', '),
        album: mediaState.work.name,
        artwork: [
          { src: mediaState.work.cover, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => changeTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => changeTrack(true));
    });

    return () => {
      unsubscribe();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [changeTrack, mediaState.currentTrack, mediaState.work]);

  if (!mediaState.open) return null;

  return (
    <div className="relative h-15 max-sm:z-10">
      <div className="fixed bottom-0 w-full">
        <VidstackPlayer
          ref={setupMediaSession}
          autoPlay
          src={mediaState.currentTrack?.mediaStreamUrl}
          onLoadStart={onLoadStart}
          onLoadedData={onLoadedData}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
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
