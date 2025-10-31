import { Link } from '@tanstack/react-router';

import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';

import { useState } from 'react';

import { writeClipboard } from '~/lib/utils';
import type { RootSearchParams } from '~/providers/router';

interface Props {
  search: RootSearchParams
  variant: 'green' | 'blue'
  icon: React.ReactNode
  text: string
  isFilter?: boolean
}

export default function BadgeMenu({ search, variant, icon, text, isFilter }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} key={String(open) /** 筛选只是添加了 url search，虽然有设置 open false，但是没用 */}>
      <DropdownMenuTrigger asChild>
        <Button
          onPointerDown={e => e.preventDefault()}
          onClick={() => setOpen(p => !p)}
          variant={variant}
          size="sm"
          className="text-xs"
        >
          {icon}
          {text}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" onInteractOutside={() => setOpen(false)}>
        <DropdownMenuItem asChild>
          <Link disabled={isFilter} to="/" search={search} onClick={() => setOpen(false)}>筛选</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            writeClipboard(text);
            setOpen(false);
          }}
        >
          复制名称
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://www.dlsite.com/maniax/fsr/=/keyword_creater/"${text}"`} target="_blank" className="w-max text-xs">
            在 DLsite 上查看
            <svg aria-hidden="true" fill="none" focusable="false" height="1em" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="1em" className="flex mx-1 text-current self-center"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></svg>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
