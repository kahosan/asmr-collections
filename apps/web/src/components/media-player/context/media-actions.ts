import { createContext, use } from 'react';

export interface MediaActionsContext {
  nextTrack: () => void
  prevTrack: () => void
}

export const MediaActionsContext = createContext<MediaActionsContext | null>(null);
export const useMediaActions = () => use(MediaActionsContext);
