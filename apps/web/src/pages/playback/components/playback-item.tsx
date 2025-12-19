import { useSetAtom } from 'jotai';

import { Button } from '~/components/ui/button';
import { confirm } from '~/components/ui/confirmer';
import { ButtonGroup } from '~/components/ui/button-group';
import { Item, ItemActions, ItemContent, ItemDescription, ItemHeader, ItemTitle } from '~/components/ui/item';

import { Link } from '~/components/link';
import { Image } from '~/components/image';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { useToastMutation } from '~/hooks/use-toast-fetch';

import { formatTimeAgoIntl } from '~/utils';

import type { Playback } from '@asmr-collections/shared';

interface Props {
  playback: Playback
  mutate: () => void
}

export function PlaybackItem({ playback, mutate }: Props) {
  const formatDate = formatTimeAgoIntl(playback.lastAt);

  const setMediaState = useSetAtom(mediaStateAtom);

  const [deletePlayback, isLoading] = useToastMutation('playback-delete');

  const handlePlay = () => {
    setMediaState({
      open: true,
      work: playback.work,
      currentTrack: playback.track,
      tracks: playback.tracks
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
            <Button size="lg" variant="secondary" onClick={handlePlay}>
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
          <Button variant="secondary" onClick={handlePlay}>
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
