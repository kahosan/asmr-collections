import { useMediaPlayer, TextTrack } from '@vidstack/react';

import { useMemo } from 'react';
import { focusAtom } from 'jotai-optics';
import { useAtom, useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';
import type { SubtitleInfo } from '~/hooks/use-media-state';

import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';

import { fetchTextTrackContent } from '../../utils';

const currentTrackAtom = focusAtom(mediaStateAtom, optic => optic.prop('currentTrack'));
const allSubtitlesAtom = focusAtom(mediaStateAtom, optic => optic.prop('allSubtitles'));

export default function SubtitleSelector() {
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const allSubtitles = useAtomValue(allSubtitlesAtom);

  const player = useMediaPlayer();

  const currentSubtitle = currentTrack?.subtitles;

  // 去重字幕名称一致的，然后排序
  const subtitles = useMemo(() => {
    return Array.from<SubtitleInfo>(allSubtitles?.reduce((map, item) => map.set(item.title, item), new Map()).values() || [])
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allSubtitles]);

  const handleChange = async (title: string) => {
    const subtitles = allSubtitles?.find(subtitle => subtitle.title === title);

    if (subtitles && currentTrack && player) {
      setCurrentTrack({
        ...currentTrack,
        subtitles
      });

      const content = await fetchTextTrackContent(subtitles.url);
      const textTrack = new TextTrack({
        content: content || subtitles.content,
        id: currentTrack.title,
        kind: 'subtitles',
        label: 'Chinese',
        default: true
      });

      player.textTracks.add(textTrack);
      textTrack.setMode('showing');
    }
  };

  return (
    <NativeSelect
      title="字幕选择"
      id="subtitle-selector"
      value={currentSubtitle?.title || ''}
      onChange={e => handleChange(e.target.value)}
      className="truncate"
      classNames={{
        wrapper: 'max-w-[60%]'
      }}
    >
      <NativeSelectOption value="">选择字幕</NativeSelectOption>
      {subtitles.map(subtitle => (
        <NativeSelectOption key={subtitle.title} value={subtitle.title}>
          {subtitle.title}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
