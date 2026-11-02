import { createContextState } from 'foxact/context-state';

export interface MediaContext {
  isTranscoded: boolean
  loop: boolean
  actions: {
    nextTrack: () => void
    prevTrack: () => void
    toggleLoop: () => void
  }
}

// 每次更改曲目都是新的 context，所以不需要 set 和 provider
export const [MediaProvider, useMedia, useSetMedia, MediaContext] = createContextState<MediaContext>();
