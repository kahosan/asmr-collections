import { confirm } from '~/components/ui/confirmer';
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator } from '~/components/ui/dropdown-menu';

import { PlaylistSubMenu, SubtitlesSubMenu } from '~/components/work-card/menu';

import { UpdateMenu } from './update';
import { ClearCacheMenu } from './clear-cache';
import { EditionPicker } from './edition-picker';

import { match } from 'ts-pattern';

import { useWorkInfo } from '~/hooks/use-work-info';
import { useWorkAction } from '~/hooks/use-work-action';

import { workDetailsRoute } from '~/providers/router/route';

const { useSearch, useNavigate } = workDetailsRoute;

export function MenuActions({ id }: { id: string }) {
  const [createAction, createIsMutating] = useWorkAction('create');
  const [deleteAction, deleteIsMutating] = useWorkAction('delete');

  // 译者版 id。访问译者版时会跳转到其语言版页面并把译者版 id 放在这里
  const t = useSearch({ select: s => s.t });
  const navigate = useNavigate();

  const { data } = useWorkInfo(id, { suspense: true });

  const handleDelete = async () => {
    const yes = await confirm({
      title: '确定要删除收藏吗?',
      description: '认真考虑哦'
    });
    if (!yes) return;

    deleteAction(id);
  };

  const handleCreate = async () => {
    if (!t) return createAction(id);

    // 当前页面是语言版，用户输入的是译者版，让用户选收藏哪个
    const languageLabel = data?.editions?.find(e => e.workId === id)?.label ?? '语言版';
    let edition = id;

    const yes = await confirm({
      title: '添加作品',
      description: '有多个版本可选',
      actionText: '收藏',
      content: (
        <EditionPicker
          defaultValue={id}
          onValueChange={v => { edition = v; }}
          options={[
            { value: id, title: languageLabel, description: id },
            { value: t, title: '译者版', description: t }
          ]}
        />
      )
    });
    if (!yes) return;

    if (edition === id) return createAction(id);

    // 收藏的是译者版，收藏完跳到它自己的页面。保留 path，音轨本来就是用译者版 id 请求的，目录一样
    createAction(edition, {
      finally: () => navigate({
        to: '/work-details/$id',
        params: { id: edition },
        search: ({ path }) => ({ path }),
        replace: true
      })
    });
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
