import { MenubarContent, MenubarMenu, MenubarTrigger, MenubarSeparator, MenubarItem, MenubarShortcut } from '~/components/ui/menubar';

import AddWorkDialog from './add-work';
import BatchUpdateDialog from './batch-update';

import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

import { useState } from 'react';
import { useSetAtom } from 'jotai';

import { useShortcut } from '~/hooks/use-shortcut';
import { showSettingDialogAtom } from '~/lib/store';

export default function OtherMenu() {
  const [showBatchUpdateDialog, setShowBatchUpdateDialog] = useState(false);
  const [showAddWorkDialog, setShowAddWorkDialog] = useState(false);

  const setShowSettingsDialog = useSetAtom(showSettingDialogAtom);

  useShortcut('u', () => setShowBatchUpdateDialog(p => !p));
  useShortcut('i', () => setShowAddWorkDialog(p => !p));

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
          <MenubarSeparator />
          <HiddenImage menuType="menubar" />
          <MenubarSeparator />
          <ThemeToggle menuType="menubar" />
          <MenubarSeparator />
          <MenubarItem onClick={() => setShowSettingsDialog(p => !p)} className="cursor-pointer">
            设置
            <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <BatchUpdateDialog key={Math.random()} open={showBatchUpdateDialog} setOpen={setShowBatchUpdateDialog} />
      <AddWorkDialog key={Math.random()} open={showAddWorkDialog} setOpen={setShowAddWorkDialog} />
    </>
  );
}
