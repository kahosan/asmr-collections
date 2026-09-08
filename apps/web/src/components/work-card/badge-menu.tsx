import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';

import { Link } from '../link';
import { MetaButton } from '../meta-button';

import { useState } from 'react';

import { externalUrl, writeClipboard } from '~/utils';
import type { Creater } from '@asmr-collections/shared';

interface Props {
  metaType: 'artists' | 'illustrators'
  creater: Creater
  isFilter?: boolean
}

export function BadgeMenu({ metaType, creater, isFilter }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} key={String(open) /** 筛选只是添加了 url search，虽然有设置 open false，但是没用 */}>
      <DropdownMenuTrigger asChild>
        <MetaButton onPointerDown={e => e.preventDefault()} onClick={() => setOpen(p => !p)} metaType={metaType} size="sm">
          {creater.name}
        </MetaButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" onInteractOutside={() => setOpen(false)}>
        {creater.id && (
          <DropdownMenuItem asChild disabled={isFilter}>
            <Link
              to="/"
              search={{
                artists: { artistId: [creater.id] },
                illustrators: { illustratorId: creater.id }
              }[metaType]}
              onClick={() => setOpen(false)}
            >
              筛选
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            writeClipboard(creater.name);
            setOpen(false);
          }}
        >
          复制名称
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={externalUrl.dlsiteKeyword(creater.name)} isExternal showAnchorIcon>
            在 DLsite 上查看
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
