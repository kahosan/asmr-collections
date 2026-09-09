import { useCallback } from 'react';
import useSWR from 'swr';

import { Button } from '~/components/ui/button';
import { FilterPanel } from '~/components/header/filter-menu/filter-panel';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

import { cn } from '~/lib/utils';
import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/utils';

import type { Data } from '@asmr-collections/shared';

interface EntityPickerProps<T extends string | number> {
  endpoint: string
  label: string
  placeholder: string
  selected: T[]
  onChange: (ids: T[]) => void
  errorText: string
  description?: string
  emptyLabel?: string
  inline?: boolean
}

export function EntityPicker<T extends string | number>({
  endpoint,
  label,
  placeholder,
  selected,
  onChange,
  errorText,
  description,
  emptyLabel,
  inline = false
}: EntityPickerProps<T>) {
  const { data, error, isLoading } = useSWR<Array<Data<T>>>(endpoint, fetcher, {
    onError: value => notifyError(value, errorText)
  });

  const handleSelect = useCallback((id: T) => {
    onChange(selected.includes(id)
      ? selected.filter(value => value !== id)
      : [...selected, id]);
  }, [onChange, selected]);

  const isChecked = useCallback(({ id }: Data<T>) => selected.includes(id), [selected]);

  return (
    <div className="space-y-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className={cn('justify-between font-normal', !inline && 'w-full')}>
            <span className="truncate">{label}</span>
            <span className="text-muted-foreground text-xs">{selected.length ? `${selected.length} 项` : emptyLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-2" align="start">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <span className="text-muted-foreground text-xs">
              {selected.length ? `已选 ${selected.length} 项` : emptyLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
            >
              清空选择
            </Button>
          </div>
          <FilterPanel
            placeholder={placeholder}
            isLoading={isLoading}
            error={error}
            errorText={errorText}
            data={data}
            handleSelect={handleSelect}
            selectedData={selected}
            isCheck={isChecked}
          />
          {inline && description && <p className="text-muted-foreground text-xs px-1 pt-2">{description}</p>}
        </PopoverContent>
      </Popover>
      {!inline && description && <p className="text-muted-foreground text-xs">{description}</p>}
    </div>
  );
}
