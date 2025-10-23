import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from '~/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';

export default function FolderBreadcrumb({ path, id }: { path?: string[], id: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/work-details/$id" params={{ id }} search={{ path: undefined }}>/</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {path?.length && path.length > 3 ? (
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1">
                <BreadcrumbEllipsis className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {path.map(item => (
                  <DropdownMenuItem key={item}>
                    <BreadcrumbLink>{item}</BreadcrumbLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
        )
          : path?.map(item => (
            <Fragment key={item}>
              <BreadcrumbItem key={item}>
                <BreadcrumbLink asChild>
                  <Link to="/work-details/$id" params={{ id }} search={{ path: path.slice(0, path.indexOf(item) + 1) }}>
                    {item}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {path.indexOf(item) !== path.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
