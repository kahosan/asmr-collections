import { Activity, useMemo, useState } from 'react';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { Virtualized, VirtualizedVirtualizer } from '~/components/ui/virtualized';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command';

import { AnimatePresence, motion } from 'framer-motion';

import Loading from '~/components/loading';

import { HTTPError } from '@asmr-collections/shared';

import type { Data } from '@asmr-collections/shared';

interface Props<T extends string | number> {
  placeholder: string
  isLoading: boolean
  error: unknown
  errorText: string
  data?: Array<Data<T>>
  handleSelect: (id: T) => void
  selectedData?: T[] | T
  isCheck: (data: Data<T>) => boolean | 'indeterminate'
}

export default function FilterPanel<T extends string | number>({
  placeholder,
  isLoading,
  error,
  errorText,
  data,
  handleSelect,
  selectedData,
  isCheck
}: Props<T>) {
  const [input, setInput] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];

    const result = input
      ? data.filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()))
      : data;

    const selectedArray = Array.isArray(selectedData)
      ? selectedData
      : (selectedData === undefined ? [] : [selectedData]);

    return result.toSorted((a, b) => {
      // eslint-disable-next-line sukka/unicorn/consistent-function-scoping -- 误报
      const getIndex = (item: Data<T>) => {
        if (selectedArray.length === 0) return -1;

        return selectedArray.findIndex(val => {
          if (val === item.id) return true;

          if (typeof val === 'number' && typeof item.id === 'number')
            return Math.abs(val) === item.id;

          if (typeof val === 'string' && typeof item.id === 'string')
            return val === `-${item.id}`;

          return false;
        });
      };

      const indexA = getIndex(a);
      const indexB = getIndex(b);

      const isSelectedA = indexA !== -1;
      const isSelectedB = indexB !== -1;

      if (isSelectedA && isSelectedB)
        return indexA - indexB;

      if (isSelectedA) return -1;
      if (isSelectedB) return 1;

      return 0;
    });
  }, [data, input, selectedData]);

  return (
    <Command className="max-[400px]:max-w-36">
      <CommandInput
        value={input}
        onValueChange={setInput}
        placeholder={placeholder}
        className="h-9"
      />
      <Virtualized asChild className="overscroll-contain">
        <CommandList className="h-48 no-scrollbar">
          <Activity mode={!error && !isLoading && (filtered.length === 0) ? 'visible' : 'hidden'}>
            <CommandEmpty>无结果</CommandEmpty>
          </Activity>
          <CommandGroup>
            <Loading isLoading={isLoading} className="w-full mx-auto mt-[50%]" />
            <ErrorComp error={error} text={errorText} />
            <Activity mode={(!error && !isLoading) ? 'visible' : 'hidden'}>
              <VirtualizedVirtualizer>
                {
                  filtered.map(({ id, name }) => {
                    const checked = isCheck({ id, name });
                    return (
                      <motion.div
                        key={id}
                        layout
                        initial={{ opacity: checked ? 1 : 0.65 }}
                        animate={{ opacity: checked ? 1 : 0.65 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <CommandItem value={name} onSelect={() => handleSelect(id)}>
                          <div className="truncate">{name}</div>
                          <AnimatePresence>
                            {checked && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.1, ease: 'easeInOut' }}
                                className="ml-auto"
                              >
                                {checked === 'indeterminate'
                                  ? <MinusIcon />
                                  : <CheckIcon />}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CommandItem>
                      </motion.div>
                    );
                  })
                }
              </VirtualizedVirtualizer>
            </Activity>
          </CommandGroup>
        </CommandList>
      </Virtualized>
    </Command>
  );
}

function ErrorComp({ error, text }: { error: unknown, text: string }) {
  if (!error) return null;
  return (
    <div className="w-full mx-auto mt-[45%] text-center text-sm opacity-80">
      {text}
      {error instanceof HTTPError && <div className="text-xs opacity-70">{error.message}</div>}
    </div>
  );
}
