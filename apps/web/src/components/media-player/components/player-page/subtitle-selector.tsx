import { useMediaPlayer, TextTrack } from '@vidstack/react';
import { useAtom, useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';
import type { SubtitleInfo } from '~/hooks/use-media-state';
import { mediaStateAtom } from '~/hooks/use-media-state';
import { fetchTextTrackContent } from '../../utils';

const currentTrackAtom = focusAtom(mediaStateAtom, optic => optic.prop('currentTrack'));
const tracksAtom = focusAtom(mediaStateAtom, optic => optic.prop('tracks'));

export default function SubtitleSelector() {
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const tracks = useAtomValue(tracksAtom);

  const player = useMediaPlayer();

  const currentSubtitle = currentTrack?.subtitles;

  const subtitles = useMemo(() => {
    if (!tracks) return [];
    return tracks.reduce<SubtitleInfo[]>((acc, track) => {
      const subtitle = track.subtitles;
      if (subtitle) acc.push(subtitle);
      return acc;
    }, []);
  }, [tracks]);

  const handleChange = async (title: string) => {
    const track = tracks?.find(track => track.subtitles?.title === title);

    if (track && currentSubtitle && player) {
      setCurrentTrack({
        ...currentTrack,
        subtitles: track.subtitles
      });

      const content = await fetchTextTrackContent(track.subtitles?.url);
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
      <SelectContent>
        {subtitles.map(subtitle => (
          <SelectItem key={subtitle.title} value={subtitle.title}>
            {subtitle.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
