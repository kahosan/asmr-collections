import { MenubarContent, MenubarMenu, MenubarTrigger, MenubarSeparator, MenubarItem, MenubarShortcut } from '~/components/ui/menubar';

import RandomWork from './random-work';
import AddWorkDialog from './add-work';
import BatchAddDialog from './batch-add';
import BatchUpdateDialog from './batch-update';
import SyncStorageDialog from './sync-storage';

import GoToDetail from '../go-to-detail';
import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { useNavigate } from '@tanstack/react-router';

import { useShortcut } from '~/hooks/use-shortcut';
import { storageOptionsAtom } from '~/hooks/use-setting-options';

export default function OtherMenu() {
  const [showAddWorkDialog, setShowAddWorkDialog] = useState(false);
  const [showBatchAddDialog, setShowBatchAddDialog] = useState(false);
  const [showBatchUpdateDialog, setShowBatchUpdateDialog] = useState(false);
  const [showSyncStorageDialog, setShowSyncStorageDialog] = useState(false);

  const storage = useAtomValue(storageOptionsAtom);

  const navigate = useNavigate();

  useShortcut('u', () => setShowBatchUpdateDialog(p => !p));
  useShortcut('i', () => setShowAddWorkDialog(p => !p));

  return (
    <>
      <MenubarMenu>
        <MenubarTrigger>
          菜单
        </MenubarTrigger>
        <MenubarContent align="end">
          <GoToDetail />
          <MenubarSeparator />
          <MenubarItem
            onClick={() => setShowAddWorkDialog(p => !p)}
          >
            添加作品
            <MenubarShortcut>⌘I</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onClick={() => setShowBatchAddDialog(p => !p)}
          >
            批量添加
          </MenubarItem>
          <MenubarItem
            onClick={() => setShowBatchUpdateDialog(p => !p)}
          >
            批量更新
            <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <RandomWork />
          <MenubarItem
            onClick={() => setShowSyncStorageDialog(p => !p)}
            disabled={!storage.enabled}
          >
            同步音声库
          </MenubarItem>
          <MenubarSeparator />
          <HiddenImage menuType="menubar" />
          <MenubarSeparator />
          <ThemeToggle menuType="menubar" />
          <MenubarSeparator />
          <MenubarItem onClick={() => navigate({ to: '/settings' })}>
            设置
            <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <BatchUpdateDialog open={showBatchUpdateDialog} setOpen={setShowBatchUpdateDialog} />
      <BatchAddDialog open={showBatchAddDialog} setOpen={setShowBatchAddDialog} />
      <AddWorkDialog open={showAddWorkDialog} setOpen={setShowAddWorkDialog} />
      <SyncStorageDialog open={showSyncStorageDialog} setOpen={setShowSyncStorageDialog} />
    </>
  );
}
