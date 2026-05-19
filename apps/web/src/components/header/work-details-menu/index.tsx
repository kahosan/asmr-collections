import { Suspense, useState } from 'react';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import { MenuActions } from './menu-actions';
import { SleepModeDialog } from './sleep-mode-dialog';

import { GoToDetail } from '../go-to-detail';
import { HiddenImage } from '../hidden-image';
import { ThemeToggle } from '../theme-toggle';

import { workDetailsRoute } from '~/providers/router/route';

const { useParams, useNavigate } = workDetailsRoute;

export function WorkDetailsMenu() {
  const { id } = useParams();

  const navigate = useNavigate();

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
          <DropdownMenuItem onClick={() => setShowSleepModeDialog(p => !p)}>
            睡眠模式
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: '/playback' })}>
            播放记录
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: '/playlists' })}>
            播放列表
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: '/settings' })}>
            设置
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SleepModeDialog open={showSleepModeDialog} setOpen={setShowSleepModeDialog} />
    </>
  );
}
