import { useState } from 'react';

import { getRouteApi } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import UpdateMenu from './update';
import ConfirmDeleteDialog from './confirm-delete';

import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

import { useSetAtom } from 'jotai';
import useSWRImmutable from 'swr/immutable';

import { useToastFetch } from '~/hooks/use-toast-fetch';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/lib/utils';
import { showSettingDialogAtom } from '~/lib/store';

export function WorkDetailsMenu() {
  const { useParams } = getRouteApi('/work-details/$id');
  const { id } = useParams();

  const [isLoading, toastcher] = useToastFetch();

  const setShowSettingsDialog = useSetAtom(showSettingDialogAtom);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: isExists, mutate } = useSWRImmutable<{ exists: boolean }>(
    `/api/work/exists/${id}`,
    fetcher,
    {
      onError: e => notifyError(e, '获取作品是否存在于数据中失败'),
      suspense: true
    }
  );

  const handleClick = () => {
    toastcher(`/api/work/create/${id}`, { method: 'POST' }, {
      loading: `${id} 添加中...`,
      success() {
        return `${id} 添加成功`;
      },
      error: `${id} 添加失败`,
      finally() {
        mutate();
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
              isExists?.exists
                ? (
                  <>
                    <UpdateMenu id={id} />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setShowDeleteDialog(p => !p)}>
                      删除此作品
                    </DropdownMenuItem>
                  </>
                )
                : (
                  <DropdownMenuItem className="cursor-pointer" onClick={handleClick} disabled={isLoading}>
                    添加此作品
                  </DropdownMenuItem>
                )
            }
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <HiddenImage menuType="dropdown" />
          <DropdownMenuSeparator />
          <ThemeToggle menuType="dropdown" />
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowSettingsDialog(p => !p)}>
            设置
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDeleteDialog open={showDeleteDialog} setOpen={setShowDeleteDialog} id={id} mutate={mutate} />
    </>
  );
}
