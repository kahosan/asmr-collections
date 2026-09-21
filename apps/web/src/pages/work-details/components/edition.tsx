import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';

import { Link } from '~/components/link';

import { CheckIcon } from 'lucide-react';

import { cn } from '~/lib/utils';
import type { WorkEdition } from '@asmr-collections/shared';

interface EditionProps {
  editions?: WorkEdition[]
  activeId: string
  t?: string
}

function getEditionLabel(edition: WorkEdition) {
  return edition.parentId ? '译者版' : edition.label;
}

export function Edition({ editions, activeId, t }: EditionProps) {
  if (!editions) return null;

  const groups = Object.values(
    editions.reduce<Record<string, WorkEdition[]>>((acc, edition) => {
      const label = getEditionLabel(edition);
      (acc[label] ??= []).push(edition);
      return acc;
    }, {})
  );

  return (
    <div className="flex flex-wrap items-center gap-2 *:px-1">
      {groups.map(items => {
        const label = getEditionLabel(items[0]);

        if (items.length === 1) {
          const edition = items[0];
          return (
            <Button key={edition.workId} asChild variant="link" size="sm" className="w-max hover:opacity-90">
              <Link
                to="/work-details/$id"
                params={{ id: edition.workId }}
                disabled={edition.workId === (t ?? activeId)}
                underline={edition.workId === (t ?? activeId) ? 'always' : undefined}
              >
                {label}
              </Link>
            </Button>
          );
        }

        return (
          <DropdownMenu key={label}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-max">
                {label}
                <Badge size="xs" className="rounded-full" variant="secondary">{items.length}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {items.map(edition => (
                <DropdownMenuItem key={edition.workId} asChild>
                  <Link
                    to="/work-details/$id"
                    params={{ id: edition.workId }}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{edition.workId}</span>
                    <span
                      className={cn(
                        'ml-auto size-4 shrink-0 scale-60 flex items-center justify-center rounded-full opacity-0 transition-all duration-150 ease-out',
                        'bg-primary',
                        edition.workId === t && 'scale-100 opacity-100'
                      )}
                    >
                      <CheckIcon className="size-2 text-primary-foreground" strokeWidth={3} />
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}
