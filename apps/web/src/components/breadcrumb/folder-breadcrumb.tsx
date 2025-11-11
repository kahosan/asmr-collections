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

export default function FolderBreadcrumb({ path}: { path?: string[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link from="/work-details/$id" search={{ path: undefined }} resetScroll={false}>/</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {
          path?.length && path.length > 3 ? (
            <BreadcrumbItem>
              <DropdownMenu key={path.join('/')}>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {
                    path.map(item => (
                      <DropdownMenuItem key={item}>
                        <BreadcrumbLink asChild>
                          <Link
                            from="/work-details/$id"
                            search={{ path: path.slice(0, path.indexOf(item) + 1) }}
                            className="w-full"
                            resetScroll={false}
                          >
                            <p className="max-w-86 max-[400px]:max-w-64 line-clamp-2">{item}</p>
                          </Link>
                        </BreadcrumbLink>
                      </DropdownMenuItem>
                    ))
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          )
            : path?.map((item, index) => (
              // eslint-disable-next-line @eslint-react/no-array-index-key -- safe here since path items are unique
              <Fragment key={`${index}-${item}`}>
                <BreadcrumbItem key={item} className="min-w-0">
                  <BreadcrumbLink asChild>
                    <Link
                      from="/work-details/$id"
                      search={{ path: path.slice(0, path.indexOf(item) + 1) }}
                      className="w-full"
                      resetScroll={false}
                    >
                      <p className="truncate">{item}</p>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {path.indexOf(item) !== path.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))
        }
      </BreadcrumbList>
    </Breadcrumb>
  );
}
