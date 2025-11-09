import { useMediaPlayer, TextTrack } from '@vidstack/react';

import { useMemo } from 'react';
import { focusAtom } from 'jotai-optics';
import { useAtom, useAtomValue } from 'jotai';
import { mediaStateAtom } from '~/hooks/use-media-state';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';

import { fetchTextTrackContent } from '../../utils';

const currentTrackAtom = focusAtom(mediaStateAtom, optic => optic.prop('currentTrack'));
const allSubtitlesAtom = focusAtom(mediaStateAtom, optic => optic.prop('allSubtitles'));

export default function SubtitleSelector() {
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const allSubtitles = useAtomValue(allSubtitlesAtom);

  const player = useMediaPlayer();

  const currentSubtitle = currentTrack?.subtitles;

  const subtitles = useMemo(() => {
    return allSubtitles?.sort((a, b) => a.title.localeCompare(b.title));
  }, [allSubtitles]);

  const handleChange = async (title: string) => {
    const subtitles = allSubtitles?.find(subtitle => subtitle.title === title);

    if (subtitles && currentSubtitle && player) {
      setCurrentTrack({
        ...currentTrack,
        subtitles
      });

      const content = await fetchTextTrackContent(subtitles.url);
      const textTrack = new TextTrack({
        content,
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
    <Select value={currentSubtitle?.title} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-120">
        {subtitles?.map(subtitle => (
          <SelectItem key={subtitle.title} value={subtitle.title}>
            {subtitle.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
