import { Activity, useMemo, useState } from 'react';
import { CheckIcon } from 'lucide-react';

import { Virtualized, VirtualizedVirtualizer } from '~/components/ui/virtualized';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command';

import { motion } from 'framer-motion';

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
  const [input, setInput] = useState('');

  const filtered = useMemo(() => {
    if (!input)
      return data;
    return data?.filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));
  }, [data, input]);

  return (
    <Command>
      <CommandInput
        value={input}
        onValueChange={setInput}
        placeholder={placeholder}
        className="h-9"
      />
      <Virtualized asChild>
        <CommandList className="h-48 no-scrollbar">
          <Activity mode={!error && !isLoading && (filtered?.length === 0) ? 'visible' : 'hidden'}>
            <CommandEmpty>无结果</CommandEmpty>
          </Activity>
          <CommandGroup>
            <Loading isLoading={isLoading} className="w-full mx-auto mt-[50%]" />
            <ErrorComp error={error} text={errorText} />
            <VirtualizedVirtualizer>
              {
                filtered?.sort(sort).map(({ id, name }) => {
                  const checked = isCheck({ id, name });
                  return (
                    <motion.div
                      key={id}
                      layout
                      initial={{ opacity: checked ? 1 : 0.65 }}
                      animate={{ opacity: checked ? 1 : 0.65 }}
                    >
                      <CommandItem value={name} onSelect={() => handleSelect(id)}>
                        <div className="max-w-36 truncate">{name}</div>
                        <CheckIcon
                          className={cn(
                            'ml-auto h-4 w-4',
                            checked ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    </motion.div>
                  );
                })
              }
            </VirtualizedVirtualizer>
          </CommandGroup>
        </CommandList>
      </Virtualized>
    </Command>
  );
}

function ErrorComp({ error, text }: { error: unknown, text: string }) {
  if (!error) return null;
  return (
    <div className="w-full mx-auto mt-[10%] text-center text-sm opacity-80">
      {text}
      {error instanceof HTTPError && <div className="text-xs opacity-70">{error.message}</div>}
    </div>
  );
}
