import { Button } from '~/components/ui/button';
import { MenubarContent, MenubarMenu, MenubarTrigger, MenubarSeparator, MenubarItem, MenubarShortcut } from '~/components/ui/menubar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';

import AddWorkDialog from './add-work';
import SettingsDialog from './settings';
import HiddenImage from './hidden-image';
import ThemeToggle from './theme-toggle';
import BatchUpdateDialog from './batch-update';

import { mutate } from 'swr';
import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { getRouteApi } from '@tanstack/react-router';

import { useIsRoute } from '~/hooks/use-is-route';

import { useShortcut } from '~/hooks/use-shortcut';
import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { useToastFetch } from '~/hooks/use-toast-fetch';
import type { Work } from '~/types/work';

export default function OtherMenu() {
  const isDetailsPage = useIsRoute('/work-details/$id');

  const [showBatchUpdateDialog, setShowBatchUpdateDialog] = useState(false);
  const [showAddWorkDialog, setShowAddWorkDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const setHiddenImage = useSetAtom(hiddenImageAtom);

  useShortcut('k', () => setHiddenImage(p => !p));
  useShortcut('u', () => setShowBatchUpdateDialog(p => !p));
  useShortcut('i', () => setShowAddWorkDialog(p => !p));
  useShortcut(',', () => setShowSettingsDialog(p => !p));

  return (
    <>
      <MenubarMenu>
        <MenubarTrigger>
          菜单
        </MenubarTrigger>
        <MenubarContent align="end">
          <MenubarItem onClick={() => setShowBatchUpdateDialog(p => !p)} className="cursor-pointer">
            批量更新
            <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => setShowAddWorkDialog(p => !p)} className="cursor-pointer">
            添加作品
            <MenubarShortcut>⌘I</MenubarShortcut>
          </MenubarItem>
          {
            isDetailsPage && (
              <>
                <MenubarSeparator />
                <WorkDetailsMenu />
                <MenubarItem className="cursor-pointer" onClick={() => setShowDeleteDialog(true)}>
                  删除此作品
                </MenubarItem>
              </>
            )
          }
          <MenubarSeparator />
          <HiddenImage />
          <MenubarSeparator />
          <ThemeToggle />
          <MenubarSeparator />
          <MenubarItem onClick={() => setShowSettingsDialog(p => !p)} className="cursor-pointer">
            设置
            <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <BatchUpdateDialog key={Math.random()} open={showBatchUpdateDialog} setOpen={setShowBatchUpdateDialog} />
      <AddWorkDialog key={Math.random()} open={showAddWorkDialog} setOpen={setShowAddWorkDialog} />
      <SettingsDialog key={Math.random()} open={showSettingsDialog} setOpen={setShowSettingsDialog} />
      {isDetailsPage && <ConfirmDeleteDialog key={Math.random()} open={showDeleteDialog} setOpen={setShowDeleteDialog} />}
    </>
  );
}

function WorkDetailsMenu() {
  const { id } = getRouteApi('/work-details/$id').useParams();

  const [isLoading, toastcher] = useToastFetch();

  const update = () => {
    toastcher<Work>(
      `/api/work/refresh/${id}`,
      { method: 'PUT' },
      {
        loading: `${id} 数据更新中...`,
        success: `${id} 数据更新成功`,
        error: `${id} 数据更新失败`,
        finally() {
          mutate(key => typeof key === 'string' && key.startsWith('/api/work'));
        }
      }
    );
  };

  return (
    <MenubarItem disabled={isLoading} className="cursor-pointer" onClick={update}>
      更新此作品信息
    </MenubarItem>
  );
}

function ConfirmDeleteDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { id } = getRouteApi('/work-details/$id').useParams();

  const [isLoading, toastcher] = useToastFetch();

  const onConfirm = () => {
    toastcher<Work>(`/api/work/delete/${id}`, { method: 'DELETE' }, {
      loading: `${id} 删除中...`,
      success: `${id} 删除成功`,
      error: `${id} 删除失败`,
      finally() {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>确定要删除收藏吗?</DialogTitle>
          <DialogDescription>
            认真考虑哦
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
