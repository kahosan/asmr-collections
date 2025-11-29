import { Suspense, useState } from 'react';

import { getRouteApi } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import MenuActions from './menu-actions';
import SleepModeDialog from './sleep-mode-dialog';

import GoToDetail from '../go-to-detail';
import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

import { useSetAtom } from 'jotai';

import { showSettingDialogAtom } from '~/lib/store';

export function WorkDetailsMenu() {
  const { useParams } = getRouteApi('/work-details/$id');
  const { id } = useParams();

  const setShowSettingsDialog = useSetAtom(showSettingDialogAtom);
  const [showSleepModeDialog, setShowSleepModeDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            菜单
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          <DropdownMenuItem asChild>
            <GoToDetail />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Suspense fallback={<DropdownMenuItem disabled>菜单项加载中...</DropdownMenuItem>}>
            <MenuActions id={id} />
          </Suspense>
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
