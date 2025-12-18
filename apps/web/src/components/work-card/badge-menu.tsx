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
import type { RootSearchParams } from '~/providers/router';

interface Props {
  search: RootSearchParams
  metaType: 'artists' | 'illustrators'
  text: string
  isFilter?: boolean
}

export function BadgeMenu({ search, metaType, text, isFilter }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} key={String(open) /** 筛选只是添加了 url search，虽然有设置 open false，但是没用 */}>
      <DropdownMenuTrigger asChild>
        <MetaButton onPointerDown={e => e.preventDefault()} onClick={() => setOpen(p => !p)} metaType={metaType} size="sm">
          {text}
        </MetaButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" onInteractOutside={() => setOpen(false)}>
        <DropdownMenuItem asChild>
          <Link disabled={isFilter} to="/" search={search} onClick={() => setOpen(false)}>筛选</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            writeClipboard(text);
            setOpen(false);
          }}
        >
          复制名称
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={externalUrl.dlsiteKeyword(text)} isExternal showAnchorIcon>
            在 DLsite 上查看
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
