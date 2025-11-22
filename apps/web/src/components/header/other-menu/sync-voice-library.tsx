import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { CheckIcon, CopyIcon, Loader2 } from 'lucide-react';

import { match } from 'ts-pattern';
import { AnimatePresence, motion } from 'framer-motion';

import useBatchOperation from '~/hooks/use-batch-operation';

export default function SyncVoiceLibraryDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const {
    copyLogs,
    handleCancel,
    handleOpenChange,
    handleStart,
    isProcessing,
    logs,
    progress
  } = useBatchOperation('create', setOpen, true);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        onInteractOutside={e => e.preventDefault()}
        className="rounded-lg max-w-[90%] sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>
            同步音声库
          </DialogTitle>
          <DialogDescription>
            将本地的音声作品同步至数据库中
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>进度 ({progress.current}/{progress.total})</span>
              <span>{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="h-2" />
          </div>

          <div className="border rounded-md relative bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 text-xs font-medium">
              <span>处理日志</span>
              <Button size="icon" variant="ghost" className="size-4" onClick={copyLogs} title="复制日志">
                <CopyIcon className="size-3.5" />
              </Button>
            </div>
            <ScrollArea className="h-50 sm:h-65 w-full">
              <div className="p-4 text-xs font-mono space-y-2">
                <AnimatePresence initial={false}>
                  {logs.length === 0 && isProcessing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      正在处理中...
                    </motion.div>
                  )}
                  {logs.length === 0 && !isProcessing && (
                    <div className="text-muted-foreground text-center py-8">准备就绪</div>
                  )}
                  {logs.map(({ type, message }) => (
                    <motion.div
                      key={message}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2"
                    >
                      {match(type)
                        .with('info', () => <span className="mt-0.5 opacity-80">{message}</span>)
                        .with('warning', () => <span className="text-yellow-500 dark:text-yellow-400/80 mt-0.5">{message}</span>)
                        .with('error', () => <span className="text-purple-500 dark:text-purple-300/80 mt-0.5">{message}</span>)
                        .exhaustive()}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <div className="flex items-center text-sm text-muted-foreground mr-auto">
            {isProcessing ? <span className="flex items-center gap-2 text-blue-500"><Loader2 className="size-4 animate-spin" />正在运行</span>
              : (progress.percent === 100
                ? <span className="flex items-center gap-2 text-green-600"><CheckIcon className="size-4" />同步完成</span>
                : <span>等待开始</span>
              )}
          </div>
          <div className="flex gap-2">
            {isProcessing ? (
              <Button variant="destructive" onClick={handleCancel}>停止</Button>
            ) : (
              <Button onClick={handleStart}>{progress.percent > 0 && progress.percent < 100 ? '重试' : '开始同步'}</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
