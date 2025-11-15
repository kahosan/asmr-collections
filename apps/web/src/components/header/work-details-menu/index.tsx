import { useState } from 'react';

import { getRouteApi } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { confirm } from '~/components/ui/confirmer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import UpdateMenu from './update';
import ClearCacheMenu from './clear-cache';
import SleepModeDialog from './sleep-mode-dialog';

import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

import { useSetAtom } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { match } from 'ts-pattern';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';
import { mutateWorkInfo } from '~/lib/mutation';
import { showSettingDialogAtom } from '~/lib/store';

export function WorkDetailsMenu() {
  const { useParams } = getRouteApi('/work-details/$id');
  const { id } = useParams();

  const [createAction, createIsMutating] = useToastMutation<{ message?: string }>('create');
  const [deleteAction, deleteIsMutating] = useToastMutation('delete');

  const setShowSettingsDialog = useSetAtom(showSettingDialogAtom);
  const [showSleepModeDialog, setShowSleepModeDialog] = useState(false);

  const { data: isExists, mutate, error } = useSWRImmutable<{ exists: boolean }>(
    `/api/work/exists/${id}`,
    fetcher,
    {
      onError: e => notifyError(e, '获取作品是否存在于数据中失败')
    }
  );

  const handleDelete = async () => {
    const yes = await confirm({
      title: '确定要删除收藏吗?',
      description: '认真考虑哦'
    });
    if (!yes) return;

    deleteAction({
      key: `/api/work/delete/${id}`,
      fetchOps: { method: 'DELETE' },
      toastOps: {
        loading: `${id} 删除中...`,
        success: `${id} 删除成功`,
        error: `${id} 删除失败`,
        finally() {
          mutate();
          mutateWorkInfo(id);
        }
      }
    });
  };

  const handleCreate = () => {
    createAction({
      key: `/api/work/create/${id}`,
      fetchOps: { method: 'POST' },
      toastOps: {
        loading: `${id} 添加中...`,
        success() {
          return `${id} 添加成功`;
        },
        description(data) {
          return data.message;
        },
        error: `${id} 添加失败`,
        finally() {
          mutate();
          mutateWorkInfo(id);
        }
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            菜单
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          <DropdownMenuGroup>
            {
              match(isExists?.exists)
                .with(true, () => (
                  <>
                    <UpdateMenu id={id} />
                    <ClearCacheMenu id={id} />
                    <DropdownMenuItem className="cursor-pointer" onClick={handleDelete} disabled={deleteIsMutating}>
                      删除作品
                    </DropdownMenuItem>
                  </>
                ))
                .with(false, () => (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleCreate} disabled={createIsMutating}>
                    添加作品
                  </DropdownMenuItem>
                ))
                .when(() => error, () => <DropdownMenuItem disabled>菜单项加载失败</DropdownMenuItem>)
                .otherwise(() => <DropdownMenuItem disabled>菜单项加载中...</DropdownMenuItem>)
            }
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <HiddenImage menuType="dropdown" />
          <DropdownMenuSeparator />
          <ThemeToggle menuType="dropdown" />
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowSleepModeDialog(p => !p)}>
            睡眠模式
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowSettingsDialog(p => !p)}>
            设置
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SleepModeDialog open={showSleepModeDialog} setOpen={setShowSleepModeDialog} />
    </>
  );
}
