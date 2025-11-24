import { match } from 'ts-pattern';
import { motion } from 'framer-motion';

import { Button } from '~/components/ui/button';
import { VirtualizerScrollArea, VirtualizedVirtualizer } from '~/components/ui/virtualized';

import { CopyIcon, Loader2 } from 'lucide-react';

import { useState } from 'react';

import type { LogType } from '~/types/batch';

interface BatchLogsProps {
  onClick: () => void
  isProcessing: boolean
  logs: Array<{ id: string, type: LogType, message: string }>
}

export default function BatchLogs({ onClick, logs, isProcessing }: BatchLogsProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = (e: Event) => {
    const target = e.currentTarget as HTMLDivElement;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 5;

    if (isAtBottom && !autoScroll)
      setAutoScroll(true);
    else if (!isAtBottom && autoScroll)
      setAutoScroll(false);
  };

  return (
    <div className="border rounded-md relative bg-muted/30">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 text-xs font-medium">
        <span>处理日志</span>
        <Button size="icon" variant="ghost" className="size-4" onClick={onClick} title="复制日志">
          <CopyIcon className="size-3.5" />
        </Button>
      </div>
      <VirtualizerScrollArea
        type="auto"
        ref={el => {
          const viewport = el?.querySelector('[data-slot="scroll-area-viewport"]');
          if (!viewport) return;

          viewport.addEventListener('scroll', handleScroll);

          if (autoScroll) viewport.scrollTop = viewport.scrollHeight;

          return () => {
            viewport.removeEventListener('scroll', handleScroll);
          };
        }}
        className="h-50 sm:h-65 w-full"
      >
        <div className="p-4 text-xs font-mono space-y-2">
          <VirtualizedVirtualizer startMargin={10}>
            {logs.length === 0 && isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-center py-8">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                正在处理中...
              </motion.div>
            )}
            {logs.length === 0 && !isProcessing && (
              <div className="text-muted-foreground text-center py-12">准备就绪</div>
            )}
            {logs.map(({ id, type, message }) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .3 }}
                className="flex items-start gap-2"
              >
                {match(type)
                  .with('info', () => <span className="mt-0.5 opacity-80">{message}</span>)
                  .with('warning', () => <span className="text-yellow-500 dark:text-yellow-400/80 mt-0.5">{message}</span>)
                  .with('error', () => <span className="text-purple-500 dark:text-purple-300/80 mt-0.5">{message}</span>)
                  .exhaustive()}
              </motion.div>
            ))}
          </VirtualizedVirtualizer>
        </div>
      </VirtualizerScrollArea>
    </div>
  );
}
