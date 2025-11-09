import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '~/lib/utils';

interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  tabs: Array<{ value: string, label: string }>
}

export function Tabs({ tabs, className, children, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root className={cn('flex flex-col w-full', className)} {...props}>
      <TabsPrimitive.List className="flex w-full border-b border-border">
        {tabs.map(tab => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative flex-1 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap',
              'text-muted-foreground hover:text-foreground',
              'data-[state=active]:text-foreground',
              'focus-visible:outline-none',
              'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
              'after:bg-transparent after:transition-colors',
              'data-[state=active]:after:bg-foreground'
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export const TabsContent = TabsPrimitive.Content;
