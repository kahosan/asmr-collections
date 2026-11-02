import { useCallback, useSyncExternalStore } from 'react';

import { usePlayerMedia } from '../player';

interface CueSnapshot {
  textTrack: TextTrack | null
  cues: VTTCue[]
  currentCue: VTTCue | undefined
  activeCue: VTTCue | undefined
}

const EMPTY_SNAPSHOT: CueSnapshot = { textTrack: null, cues: [], currentCue: undefined, activeCue: undefined };

function noop() { /* nothing to unsubscribe */ }

// 快照需要在数据未变化时保持同一引用，否则会无限重新渲染；同一个媒体元素的数据相同，按元素缓存
// 所有依赖原生对象的派生值都在这里计算：TextTrack 引用不变时 cue 内容仍会变化，
// 若在渲染中派生，会被 React Compiler 以 textTrack 为依赖缓存住
const snapshotCache = new WeakMap<HTMLMediaElement, CueSnapshot>();

function getCueSnapshot(media: unknown): CueSnapshot {
  if (!(media instanceof HTMLMediaElement)) return EMPTY_SNAPSHOT;

  const textTrack = Array.from(media.textTracks).find(t => t.kind === 'subtitles' && t.mode !== 'disabled') ?? null;
  const cueCount = textTrack?.cues?.length ?? 0;
  const currentCue = textTrack?.activeCues?.[0] as VTTCue | undefined;

  const last = snapshotCache.get(media);
  if (
    last?.textTrack === textTrack
    && last.cues.length === cueCount
    && last.currentCue === currentCue
  ) return last;

  const cues = Array.from(textTrack?.cues ?? []) as VTTCue[];
  // 两条字幕之间没有正在显示的 cue 时保持上一条，还未到第一条时显示第一条
  const activeCue = currentCue
    ?? cues.findLast(cue => cue.startTime <= media.currentTime)
    ?? cues.at(0);

  const snapshot = { textTrack, cues, currentCue, activeCue };
  snapshotCache.set(media, snapshot);
  return snapshot;
}

export function useActiveCue() {
  const media = usePlayerMedia();

  const subscribe = useCallback((onChange: () => void) => {
    if (!(media instanceof HTMLMediaElement)) return noop;

    const textTracks = media.textTracks;

    textTracks.addEventListener('addtrack', onChange);
    textTracks.addEventListener('removetrack', onChange);
    textTracks.addEventListener('change', onChange);
    // <track> 元素上的 load（cue 解析完成）和 cuechange 不冒泡，在捕获阶段监听
    media.addEventListener('load', onChange, true);
    media.addEventListener('cuechange', onChange, true);

    return () => {
      textTracks.removeEventListener('addtrack', onChange);
      textTracks.removeEventListener('removetrack', onChange);
      textTracks.removeEventListener('change', onChange);
      media.removeEventListener('load', onChange, true);
      media.removeEventListener('cuechange', onChange, true);
    };
  }, [media]);

  const { textTrack, cues, activeCue } = useSyncExternalStore(subscribe, () => getCueSnapshot(media));

  return { textTrack, cues, activeCue };
}
