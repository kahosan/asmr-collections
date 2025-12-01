import { useEffect, useState } from 'react';
import { useMediaState } from '@vidstack/react';

export function useActiveCue() {
  const textTrackState = useMediaState('textTrack');

  const [activeCue, setActiveCue] = useState<VTTCue>();

  useEffect(() => {
    if (!textTrackState) return;

    const onCueChange = () => {
      const cues = textTrackState.activeCues;
      const cue = cues.at(0) as VTTCue | undefined;
      if (cue) setActiveCue(cue);
    };

    const onLoad = () => {
      const cues = textTrackState.cues;
      const cue = cues.at(0) as VTTCue | undefined;
      setActiveCue(cue);
    };

    textTrackState.addEventListener('load', onLoad);
    textTrackState.addEventListener('cue-change', onCueChange);

    return () => {
      textTrackState.removeEventListener('load', onLoad);
      textTrackState.removeEventListener('cue-change', onCueChange);
    };
  }, [textTrackState]);

  return {
    activeCue,
    textTrackState
  };
}
