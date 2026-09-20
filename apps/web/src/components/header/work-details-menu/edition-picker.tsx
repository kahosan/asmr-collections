import type { ReactNode } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { CheckIcon } from 'lucide-react';

import { cn } from '~/lib/utils';

export interface EditionOption {
  value: string
  title: ReactNode
  description?: ReactNode
}

interface EditionPickerProps {
  options: EditionOption[]
  defaultValue: string
  onValueChange: (value: string) => void
}

/**
 * 卡片式单选：每个版本一张卡片，选中的用主色边框和打勾徽章高亮。
 * 卡片本身就是 Radix 的 radio item，选中态全部走 data-state，不需要自己维护状态。
 * confirm 的 content 只在调用时渲染一次，所以这里是非受控的，选中值通过 onValueChange 带出去
 */
export function EditionPicker({ options, defaultValue, onValueChange }: EditionPickerProps) {
  return (
    <RadioGroupPrimitive.Root defaultValue={defaultValue} onValueChange={onValueChange} className="grid gap-2">
      {options.map(option => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            'group/edition flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors outline-none',
            'data-unchecked:hover:border-muted-foreground/40',
            'border-border focus-visible:ring-3 focus-visible:ring-ring/50',
            'data-checked:border-2 data-checked:border-primary/80 data-checked:bg-primary/5 data-checked:p-2.75'
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium group-data-checked/edition:text-primary">{option.title}</span>
            {option.description && (
              <span className="text-muted-foreground text-xs group-data-checked/edition:text-primary/80">{option.description}</span>
            )}
          </div>
          <span
            className={cn(
              'flex size-5 shrink-0 scale-60 items-center justify-center rounded-full opacity-0 transition-all duration-150 ease-out',
              'bg-primary text-primary-foreground group-data-checked/edition:scale-100 group-data-checked/edition:opacity-100'
            )}
          >
            <CheckIcon className="size-3" strokeWidth={3} />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
