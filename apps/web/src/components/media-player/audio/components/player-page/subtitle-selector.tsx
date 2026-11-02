import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { mediaStateAtom } from '~/hooks/use-media-state';

import { NativeSelect, NativeSelectOption } from '~/components/ui/native-select';

import type { SubtitleInfo } from '@asmr-collections/shared';

const currentTrackAtom = focusAtom(mediaStateAtom, optic => optic.prop('currentTrack'));

interface Props {
  allSubtitles: SubtitleInfo[]
}

export function SubtitleSelector({ allSubtitles }: Props) {
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);

  const currentSubtitle = currentTrack?.subtitles;

  // 去重字幕名称一致的，然后排序
  const subtitles = useMemo(() => {
    return Array.from<SubtitleInfo>(allSubtitles.reduce((map, item) => map.set(item.title, item), new Map()).values())
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allSubtitles]);

  // 播放器根据 currentTrack.subtitles 重新生成 <track>
  const handleChange = (title: string) => {
    const subtitles = allSubtitles.find(subtitle => subtitle.title === title);

    if (subtitles && currentTrack) {
      setCurrentTrack({
        ...currentTrack,
        subtitles
      });
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
