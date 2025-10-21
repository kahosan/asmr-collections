import { CheckIcon } from 'lucide-react';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command';

import Loading from '~/components/loading';

import { cn } from '~/lib/utils';
import { HTTPError } from '~/lib/fetcher';

import type { Data } from '~/types/work';

interface Props<T extends string | number> {
  placeholder: string
  isLoading: boolean
  error: unknown
  errorText: string
  data?: Array<Data<T>>
  sort: (data: Data<T>) => number
  handleSelect: (id: T) => void
  isCheck: (data: Data<T>) => boolean
}

export default function FilterPanel<T extends string | number>({
  placeholder,
  isLoading,
  error,
  errorText,
  data,
  sort,
  handleSelect,
  isCheck
}: Props<T>) {
  return (
    <Command>
      <CommandInput placeholder={placeholder} className="h-9" />
      <CommandList className="h-48 no-scrollbar">
        {(!error && !isLoading && (data?.length === 0)) && <CommandEmpty>无结果</CommandEmpty>}
        <CommandGroup>
          {isLoading && <Loading isLoading={isLoading} className="w-full mx-auto mt-[50%]" />}
          {error
            ? <div className="w-full mx-auto mt-[10%] text-center text-sm opacity-80">
              {errorText}
              {error instanceof HTTPError && <div className="text-xs opacity-70">{error.message}</div>}
            </div>
            : null}
          {data?.sort(sort).map(({ id, name }) => (
            <CommandItem key={id} value={name} onSelect={() => handleSelect(id)}>
              <div className="max-w-36 truncate">{name}</div>
              <CheckIcon
                className={cn(
                  'ml-auto h-4 w-4',
                  isCheck({ id, name }) ? 'opacity-100' : 'opacity-0'
                )}
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
