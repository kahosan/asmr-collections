import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { toast } from 'sonner';
import { useState } from 'react';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { logger } from '~/lib/logger';
import type { BatchOperationResponse } from '~/types/work';

export default function BatchUpdateDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [batchUpdateAction, m1] = useToastMutation<BatchOperationResponse>('batch-refresh');
  const [cancelBatcUpdateAction, m2] = useToastMutation<BatchOperationResponse>('batch-refresh-cancel');

  const [failedIds, setFailedIds] = useState<string[]>([]);

  const isMutating = m1 || m2;

  const handleBatchUpdate = () => {
    if (isMutating) {
      toast.warning('批量更新已在进行中', { position: 'bottom-right' });
      return;
    }

    batchUpdateAction({
      key: '/api/work/batch/refresh',
      fetchOps: { method: 'POST' },
      toastOps: {
        loading: '批量更新中...',
        success(data) {
          return data.message;
        },
        description(data) {
          if (data.failed.length > 0) {
            setFailedIds(data.failed.map(f => f.id));
            logger.warn(data.failed, '批量更新失败列表');
            return `更新失败 ${data.failed.length} 个，详情查看控制台`;
          }
        }
      }
    });
  };

  const handleBatchUpdateCancel = () => {
    if (!isMutating) {
      toast.warning('当前没有进行中的操作', { position: 'bottom-right' });
      return;
    }

    if (m2) {
      toast.warning('取消操作已在进行中', { position: 'bottom-right' });
      return;
    }

    cancelBatcUpdateAction({
      key: '/api/work/batch/cancel',
      fetchOps: { method: 'POST', body: 'refresh' },
      toastOps: {
        loading: '正在取消操作...',
        success(data) {
          return data.message;
        },
        error: '取消操作失败'
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (isMutating)
          toast.warning('请先等待更新完成', { position: 'bottom-right' });
        else
          setOpen(isOpen);
      }}
    >
      <DialogContent
        onInteractOutside={e => e.preventDefault()}
        className="rounded-lg max-w-[90%] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>
            批量更新收藏信息
          </DialogTitle>
          <DialogDescription>
            从 DLsite 获取最新的信息
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Button disabled={isMutating} onClick={handleBatchUpdate}>
            批量更新
          </Button>
          <Button
            variant="outline"
            disabled={m2 || !isMutating}
            onClick={handleBatchUpdateCancel}
          >
            取消操作
          </Button>
        </div>
        <Textarea
          className="w-full h-44 border rounded-lg resize-none placeholder:text-sm text-sm"
          placeholder="失败列表"
          readOnly
          value={failedIds.join('\n')}
        />
      </DialogContent>
    </Dialog>
  );
}
