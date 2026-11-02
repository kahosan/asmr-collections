import { focusAtom } from 'jotai-optics';
import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';

import { throttle } from '@asmr-collections/shared';

import { AudioMedia } from './audio';

import { useSubtitleSource } from './hooks/use-subtitle-source';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { prepareTracks, usePlayback } from '~/hooks/use-playback';

import type { MediaProps } from './types';

const openAtom = focusAtom(mediaStateAtom, optic => optic.prop('open'));

export function MediaPlayer() {
  const open = useAtomValue(openAtom);

  if (!open) return null;

  return <MediaPlayerInstance />;
}

/**
 * 播放列表、播放进度同步、Media Session、字幕等与具体播放器无关的逻辑
 */
function MediaPlayerInstance() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);
  const { trigger: updatePlayback } = usePlayback();

  const currentTrack = mediaState.currentTrack;

  const subtitleSrc = useSubtitleSource(currentTrack?.subtitles);

  const changeTrack = useCallback((next = false) => {
    const currentIndex = mediaState.tracks?.findIndex(track => track.title === currentTrack?.title);
    // index is 0
    if (currentIndex === undefined || currentIndex === -1) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = mediaState.tracks?.at(nextIndex);

    if (!nextTrack || nextIndex < 0) return;
    setMediaState(prev => ({ ...prev, currentTrack: nextTrack }));
  }, [currentTrack?.title, mediaState.tracks, setMediaState]);

  const onLoadedData = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    if (currentTrack?.position)
      e.currentTarget.currentTime = currentTrack.position;
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

  const onTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    throttledUpdatePlayback(e.currentTarget.currentTime);
  }, [throttledUpdatePlayback]);

  const onPause = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    updatePlaybackFn(e.currentTarget.currentTime);
  }, [updatePlaybackFn]);

  const onSeeked = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
    updatePlaybackFn(e.currentTarget.currentTime, true);
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

  const mediaProps: MediaProps = {
    track: currentTrack,
    subtitleSrc,
    prev: () => changeTrack(),
    next: () => changeTrack(true),
    onLoadedData,
    onTimeUpdate,
    onCanPlay: updateMediaMetadata,
    onEnded,
    onPause,
    onSeeked
  };

  return <AudioMedia {...mediaProps} />;
}
