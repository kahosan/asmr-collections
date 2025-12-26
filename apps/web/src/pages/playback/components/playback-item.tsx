import { useSetAtom } from 'jotai';

import { Button } from '~/components/ui/button';
import { confirm } from '~/components/ui/confirmer';
import { ButtonGroup } from '~/components/ui/button-group';
import { Item, ItemActions, ItemContent, ItemDescription, ItemHeader, ItemTitle } from '~/components/ui/item';

import { Link } from '~/components/link';
import { Image } from '~/components/image';

import useSWRMutation from 'swr/mutation';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { useToastMutation } from '~/hooks/use-toast-fetch';

import { SubtitleMatcher } from '@asmr-collections/shared';

import { formatTimeAgoIntl } from '~/utils';

import { logger } from '~/lib/logger';
import { fetcher } from '~/lib/fetcher';

import type { SubtitleInfo, Playback } from '@asmr-collections/shared';

interface Props {
  playback: Playback
  mutate: () => void
}

export function PlaybackItem({ playback, mutate }: Props) {
  const formatDate = formatTimeAgoIntl(playback.lastAt);

  const setMediaState = useSetAtom(mediaStateAtom);

  const { trigger: fetchSubtitles, isMutating: isLoadingSubtitles } = useSWRMutation<SubtitleInfo[]>(
    `/api/subtitles/${playback.work.id}`,
    (key: string) => fetcher<SubtitleInfo[]>(key)
  );

  const [deletePlayback, isLoading] = useToastMutation('playback-delete');

  const handlePlay = async () => {
    let subtitles: SubtitleInfo[] = [];
    let subtitleMatcher: SubtitleMatcher | undefined;

    try {
      if (playback.work.subtitles) {
        subtitles = await fetchSubtitles();
        subtitleMatcher = new SubtitleMatcher([subtitles]);
      }
    } catch (e) {
      logger.error(e, '获取字幕失败');
    }

    const currentTrack = {
      ...playback.track,
      subtitles: playback.track.subtitles ?? subtitleMatcher?.find(playback.track.title),
      position: playback.position
    };

    const tracks = playback.tracks.map(item => {
      const subtitles = item.subtitles ?? subtitleMatcher?.find(item.title);
      return {
        ...item,
        subtitles
      };
    });

    const work = {
      ...playback.work,
      exists: true
    };

    setMediaState({
      open: true,
      work,
      allSubtitles: subtitles,
      currentTrack,
      tracks
    });
  };

  const handleDelete = async () => {
    const yes = await confirm({
      title: '确认删除播放记录？',
      description: '认真考虑哦'
    });

    if (!yes) return;

    deletePlayback({
      key: `/api/playback/${playback.work.id}`,
      fetchOps: {
        method: 'DELETE'
      },
      toastOps: {
        loading: '正在删除播放记录...',
        success: '播放记录已删除',
        error: '删除播放记录失败',
        finally() {
          mutate();
        }
      }
    });
  };

  return (
    <Item variant="outline" className="bg-card p-0 sm:pr-4 sm:flex-nowrap">
      <div className="max-sm:hidden">
        <Image
          src={playback.work.cover}
          alt={playback.work.name}
          classNames={{ wrapper: 'size-20 rounded-tl-md rounded-bl-md' }}
        />
      </div>
      <ItemHeader className="sm:hidden">
        <Image
          src={playback.work.cover}
          alt={playback.work.name}
          classNames={{ wrapper: 'pb-[65%] w-full rounded-tl-md rounded-tr-md' }}
        />
      </ItemHeader>
      <ItemContent className="gap-2 max-sm:gap-4 max-sm:p-4 max-sm:pt-0">
        <ItemTitle className="text-base block sm:line-clamp-1">
          {playback.work.name}
        </ItemTitle>
        <ItemDescription className="sm:w-[90%] sm:line-clamp-1">
          {formatDate} 听到「{playback.track.title}」
        </ItemDescription>
        <ItemActions className="sm:hidden mt-2">
          <ButtonGroup className="w-full *:flex-1">
            <Button size="lg" variant="secondary" onClick={handlePlay} disabled={isLoadingSubtitles}>
              播放
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/work-details/$id" params={{ id: playback.work.id }}>详情</Link>
            </Button>
            <Button size="lg" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              删除
            </Button>
          </ButtonGroup>
        </ItemActions>
      </ItemContent>
      <ItemActions className="max-sm:hidden">
        <ButtonGroup>
          <Button variant="secondary" onClick={handlePlay} disabled={isLoadingSubtitles}>
            播放
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/work-details/$id" params={{ id: playback.work.id }}>详情</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            删除
          </Button>
        </ButtonGroup>
      </ItemActions>
    </Item>
  );
}
