import { createPlayer, textTrackFeature } from '@videojs/react';
import { audioFeatures } from '@videojs/react/audio';

// audio 预设不含字幕 feature，补上以支持字幕状态与 toggleSubtitles 快捷键
export const { Player: AudioPlayer, usePlayer, useMedia: usePlayerMedia } = createPlayer({
  features: [...audioFeatures, textTrackFeature]
});
