import { useState } from 'react';

import { getRouteApi } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import UpdateMenu from './update';
import SleepModeDialog from './sleep-mode-dialog';
import ConfirmDeleteDialog from './confirm-delete';

import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

import { useSetAtom } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { match } from 'ts-pattern';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';
import { showSettingDialogAtom } from '~/lib/store';

export function WorkDetailsMenu() {
  const { useParams } = getRouteApi('/work-details/$id');
  const { id } = useParams();

  const [createAction, createIsMutating] = useToastMutation<{ message?: string }>('create');

  const setShowSettingsDialog = useSetAtom(showSettingDialogAtom);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSleepModeDialog, setShowSleepModeDialog] = useState(false);

  const { data: isExists, mutate, error } = useSWRImmutable<{ exists: boolean }>(
    `/api/work/exists/${id}`,
    fetcher,
    {
      onError: e => notifyError(e, '获取作品是否存在于数据中失败')
    }
  );

  const handleClick = () => {
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
        finally() { mutate(); }
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
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setShowDeleteDialog(p => !p)}>
                      删除作品
                    </DropdownMenuItem>
                  </>
                ))
                .with(false, () => (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleClick} disabled={createIsMutating}>
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
      <ConfirmDeleteDialog open={showDeleteDialog} setOpen={setShowDeleteDialog} id={id} mutate={mutate} />
      <SleepModeDialog open={showSleepModeDialog} setOpen={setShowSleepModeDialog} />
    </>
  );
}
