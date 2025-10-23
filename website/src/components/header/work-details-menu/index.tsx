import { useState } from 'react';

import { getRouteApi } from '@tanstack/react-router';

import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import UpdateMenu from './update';
import ConfirmDeleteDialog from './confirm-delete';

import SettingsDialog from '../settings';
import HiddenImage from '../hidden-image';
import ThemeToggle from '../theme-toggle';

export function WorkDetailsMenu() {
  const { useParams } = getRouteApi('/work-details/$id');
  const { id } = useParams();

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            菜单
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-46">
          <DropdownMenuGroup>
            <UpdateMenu id={id} />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowDeleteDialog(p => !p)}>
              删除此作品
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <HiddenImage menuType="dropdown" />
          <DropdownMenuSeparator />
          <ThemeToggle menuType="dropdown" />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setShowSettingsDialog(p => !p)}>
            设置
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog open={showSettingsDialog} setOpen={setShowSettingsDialog} />
      <ConfirmDeleteDialog open={showDeleteDialog} setOpen={setShowDeleteDialog} id={id} />
    </>
  );
}
