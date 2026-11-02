import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { CaptionsIcon, ListVideoIcon, SkipBackIcon, SkipForwardIcon, XIcon } from 'lucide-react';

import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { useHotkey } from '@videojs/react';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { CAPTION_SIZES, captionSizeAtom } from './hooks/use-caption-size';

import { cn } from '~/lib/utils';

import type { SubtitleInfo } from '@asmr-collections/shared';
import type { CaptionSize } from './hooks/use-caption-size';

// 「关闭」选项的值，字幕标题不会为空字符串
const SUBTITLE_OFF = '';

interface VideoToolbarProps {
  title?: string
  prev: () => void
  next: () => void
  onClose: () => void
}

// 位于 skin 之外，全屏时不可见；全屏下可用快捷键或 Media Session 切换
export function VideoToolbar({ title, prev, next, onClose }: VideoToolbarProps) {
  useHotkey({ keys: 'Shift+p', onActivate: prev });
  useHotkey({ keys: 'Shift+n', onActivate: next });

  return (
    <div
      className={cn(
        'flex max-w-full items-center gap-1 rounded-full border px-2 py-1',
        'bg-card/80 shadow-lg backdrop-blur-md'
      )}
    >
      <Button variant="ghost" size="icon-sm" className="rounded-full" title="上一个" onClick={prev}>
        <SkipBackIcon fill="currentColor" />
      </Button>
      <Button variant="ghost" size="icon-sm" className="rounded-full" title="下一个" onClick={next}>
        <SkipForwardIcon fill="currentColor" />
      </Button>
      <p className="mx-2 min-w-0 truncate text-sm" title={title}>{title || '未知视频'}</p>
      <PlaylistMenu />
      <SubtitleMenu />
      <Button variant="ghost" size="icon-sm" className="rounded-full" title="关闭" onClick={onClose}>
        <XIcon />
      </Button>
    </div>
  );
}

// 非模态：模态菜单会给 body 加 data-scroll-locked，globals.css 会重置 overflow 导致出现滚动条
function PlaylistMenu() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);

  const tracks = mediaState.tracks ?? [];

  const onChange = (title: string) => {
    const track = tracks.find(track => track.title === title);
    if (track) setMediaState(prev => ({ ...prev, currentTrack: track }));
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full" title="播放列表">
          <ListVideoIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="max-h-80 w-72">
        <DropdownMenuLabel>播放列表</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={mediaState.currentTrack?.title} onValueChange={onChange}>
          {tracks.map(track => (
            <DropdownMenuRadioItem key={track.title} value={track.title} title={track.title}>
              <span className="truncate">{track.title}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubtitleMenu() {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);
  const [captionSize, setCaptionSize] = useAtom(captionSizeAtom);

  // 去重字幕名称一致的，然后排序
  const subtitles = useMemo(() => {
    const all = mediaState.allSubtitles ?? [];
    return Array.from<SubtitleInfo>(all.reduce((map, item) => map.set(item.title, item), new Map()).values())
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [mediaState.allSubtitles]);

  // 播放器根据 currentTrack.subtitles 重新生成 <track>，undefined 即关闭字幕
  const onSubtitleChange = (title: string) => {
    const subtitle = subtitles.find(subtitle => subtitle.title === title);
    setMediaState(prev => (prev.currentTrack
      ? { ...prev, currentTrack: { ...prev.currentTrack, subtitles: subtitle } }
      : prev));
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full" title="字幕">
          <CaptionsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="max-h-96 w-64">
        <DropdownMenuLabel>字幕</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={mediaState.currentTrack?.subtitles?.title ?? SUBTITLE_OFF}
          onValueChange={onSubtitleChange}
        >
          <DropdownMenuRadioItem value={SUBTITLE_OFF}>关闭</DropdownMenuRadioItem>
          {subtitles.map(subtitle => (
            <DropdownMenuRadioItem key={subtitle.title} value={subtitle.title} title={subtitle.title}>
              <span className="truncate">{subtitle.title}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>字幕大小</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={captionSize} onValueChange={value => setCaptionSize(value as CaptionSize)}>
          {CAPTION_SIZES.map(size => (
            <DropdownMenuRadioItem key={size.value} value={size.value}>
              {size.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
