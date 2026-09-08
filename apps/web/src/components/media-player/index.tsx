import { MediaPlayer as VidstackPlayer, MediaProvider, MEDIA_KEY_SHORTCUTS, TextTrack } from '@vidstack/react';
import type { MediaLoadedDataEvent, MediaPauseEvent, MediaPlayingEvent, MediaTimeUpdateEventDetail } from '@vidstack/react';

import { AudioPlayerLayout } from './layout';

import { focusAtom } from 'jotai-optics';
import { createPortal } from 'react-dom';
import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';

import { throttle } from '@asmr-collections/shared';

import { useMediaSrc } from './hooks/use-media-src';
import { usePrefetchNext } from './hooks/use-prefetch-next';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { prepareTracks, usePlayback } from '~/hooks/use-playback';

import { fetchTextTrackContent } from './utils';

const openAtom = focusAtom(mediaStateAtom, optic => optic.prop('open'));
const qualityAtom = focusAtom(settingOptionsAtom, optic => optic.prop('asmrone').prop('quality'));

export function MediaPlayer() {
  const open = useAtomValue(openAtom);

  if (!open) return null;

  return <MediaPlayerInstance />;
}

function MediaPlayerInstance() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);
  const { trigger: updatePlayback } = usePlayback();

  const currentTrack = mediaState.currentTrack;

  const quality = useAtomValue(qualityAtom);
  const url = quality === 'high'
    ? currentTrack?.mediaStreamUrl
    : (currentTrack?.streamLowQualityUrl || currentTrack?.mediaStreamUrl);

  const { mediaSrc, isTranscoded } = useMediaSrc(url);

  const nextTrack = useMemo(() => {
    const currentIndex = mediaState.tracks?.findIndex(track => track.title === currentTrack?.title);
    if (currentIndex === undefined || currentIndex === -1) return null;

    const nextIndex = currentIndex + 1;
    return mediaState.tracks?.at(nextIndex) || null;
  }, [currentTrack?.title, mediaState.tracks]);

  const { triggerPrefetch } = usePrefetchNext(nextTrack?.mediaStreamUrl);

  const changeTrack = useCallback((next = false) => {
    const currentIndex = mediaState.tracks?.findIndex(track => track.title === currentTrack?.title);
    // index is 0
    if (currentIndex === undefined || currentIndex === -1) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = mediaState.tracks?.at(nextIndex);

    if (!nextTrack || nextIndex < 0) return;
    setMediaState(prev => ({ ...prev, currentTrack: nextTrack }));
  }, [currentTrack?.title, mediaState.tracks, setMediaState]);

  const onLoadStart = useCallback(async (e: MediaPlayingEvent) => {
    // 清理已存在的字幕轨道
    e.target.textTracks.clear();

    const subtitles = currentTrack?.subtitles;

    const src = subtitles?.url;
    const stateContent = subtitles?.content;

    const content = await fetchTextTrackContent(src);

    if (!content && !stateContent && !src) return;

    const track = new TextTrack({
      content: content || stateContent,
      id: currentTrack?.title,
      kind: 'subtitles',
      label: 'Chinese',
      default: true,
      type: subtitles?.type
    });

    e.target.textTracks.add(track);
    track.setMode('showing');
  }, [currentTrack]);

  const onLoadedData = useCallback((e: MediaLoadedDataEvent) => {
    if (currentTrack?.position)
      e.target.currentTime = currentTrack.position;
  }, [currentTrack]);

  const updatePlaybackFn = useCallback((currentTime: number, force = false) => {
    // 作品未收藏时不更新播放进度
    if (
      !mediaState.work
      || !mediaState.work.favorited
      || !currentTrack
    ) return;

    const id = mediaState.work.id;
    const track = currentTrack;
    const tracks = mediaState.tracks;

    const position = Math.floor(currentTime);

    if (position === 0 && !force) return;

    updatePlayback({ id, track: prepareTracks(track), tracks: prepareTracks(tracks), position });
  }, [currentTrack, mediaState.tracks, mediaState.work, updatePlayback]);

  const throttledUpdatePlayback = useMemo(() => throttle(updatePlaybackFn, 10000), [updatePlaybackFn]);

  const onEnded = useCallback(() => {
    changeTrack(true);

    updatePlaybackFn(0, true);
  }, [changeTrack, updatePlaybackFn]);

  const onTimeUpdate = useCallback((detail: MediaTimeUpdateEventDetail) => {
    const currentTime = detail.currentTime;

    if (currentTime > 30)
      triggerPrefetch();

    throttledUpdatePlayback(currentTime);
  }, [triggerPrefetch, throttledUpdatePlayback]);

  const onPause = useCallback((e: MediaPauseEvent) => {
    const currentTime = e.target.currentTime;
    updatePlaybackFn(currentTime);
  }, [updatePlaybackFn]);

  const onSeeked = useCallback((detail: number) => {
    updatePlaybackFn(detail, true);
  }, [updatePlaybackFn]);

  const updateMediaMetadata = useCallback(() => {
    if (
      !('mediaSession' in navigator)
      || !currentTrack
      || !mediaState.work
    ) return;

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
  }, [changeTrack, currentTrack, mediaState.work]);

  return createPortal(
    <div className="relative h-15 max-sm:z-10">
      <div className="fixed bottom-0 w-full">
        <VidstackPlayer
          autoPlay
          src={mediaSrc}
          onLoadStart={onLoadStart}
          onLoadedData={onLoadedData}
          onTimeUpdate={onTimeUpdate}
          onCanPlay={updateMediaMetadata}
          onEnded={onEnded}
          onPause={onPause}
          onSeeked={onSeeked}
          keyTarget="document"
          keyShortcuts={MEDIA_KEY_SHORTCUTS}
        >
          <MediaProvider />
          <AudioPlayerLayout
            isTranscoded={isTranscoded}
            prev={() => changeTrack()}
            next={() => changeTrack(true)}
          />
        </VidstackPlayer>
      </div>
    </div>,
    document.body
  );
}
