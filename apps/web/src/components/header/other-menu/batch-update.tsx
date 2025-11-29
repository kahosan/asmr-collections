import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { CheckIcon, Loader2 } from 'lucide-react';

import BatchLogs from './batch-logs';

import { useBatchOperation } from '~/hooks/use-batch-operation';
import { usePreventAutoFocus } from '~/hooks/use-prevent-auto-focus';

export default function BatchUpdateDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const {
    copyLogs,
    handleCancel,
    handleOpenChange,
    handleStart,
    isProcessing,
    logs,
    progress
  } = useBatchOperation('update', setOpen);

  const prevent = usePreventAutoFocus();

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        {...prevent}
        onInteractOutside={e => e.preventDefault()}
        className="rounded-lg max-w-[90%] sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>
            批量更新收藏信息
          </DialogTitle>
          <DialogDescription>
            从 DLsite 获取最新的信息
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

          <BatchLogs isProcessing={isProcessing} logs={logs} onClick={copyLogs} />
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <div className="flex items-center text-sm text-muted-foreground mr-auto">
            {isProcessing ? <span className="flex items-center gap-2 text-blue-500"><Loader2 className="size-4 animate-spin" />正在运行</span>
              : (progress.percent === 100
                ? <span className="flex items-center gap-2 text-green-600"><CheckIcon className="size-4" />更新完成</span>
                : <span>等待开始</span>
              )}
          </div>
          <div className="flex gap-2">
            {isProcessing ? (
              <Button variant="destructive" onClick={handleCancel}>停止</Button>
            ) : (
              <Button onClick={handleStart}>{progress.percent > 0 && progress.percent < 100 ? '重试' : '开始更新'}</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
