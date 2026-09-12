import { confirm } from '~/components/ui/confirmer';
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from '~/components/ui/dropdown-menu';

import { PlaylistSubMenu, SubtitlesSubMenu } from '~/components/work-card/menu';

import { UpdateMenu } from './update';
import { ClearCacheMenu } from './clear-cache';

import { match } from 'ts-pattern';

import { useWorkInfo } from '~/hooks/use-work-info';
import { useWorkAction } from '~/hooks/use-work-action';

export function MenuActions({ id }: { id: string }) {
  const [createAction, createIsMutating] = useWorkAction('create');
  const [deleteAction, deleteIsMutating] = useWorkAction('delete');

  const { data } = useWorkInfo(id, { suspense: true });

  const handleDelete = async () => {
    const yes = await confirm({
      title: '确定要删除收藏吗?',
      description: '认真考虑哦'
    });
    if (!yes) return;

    deleteAction(id);
  };

  const handleCreate = () => {
    createAction(id);
  };
  return (
    <DropdownMenuGroup>
      {
        match(data?.favorited)
          .with(true, () => (
            <>
              <UpdateMenu id={id} />
              <ClearCacheMenu id={id} />
              <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={deleteIsMutating}>
                删除作品
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SubtitlesSubMenu id={id} existsSubtitles />
              <PlaylistSubMenu workId={id} />
            </>
          ))
          .with(false, () => (
            <DropdownMenuItem onClick={handleCreate} disabled={createIsMutating}>
              添加作品
            </DropdownMenuItem>
          ))
          .otherwise(() => <DropdownMenuItem disabled>菜单项加载失败</DropdownMenuItem>)
      }
    </DropdownMenuGroup>
  );
}
