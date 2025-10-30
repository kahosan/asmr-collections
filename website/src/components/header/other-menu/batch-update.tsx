import { Button } from '~/components/ui/button';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { motion } from 'framer-motion';

import { toast } from 'sonner';
import { useState } from 'react';
import { CopyIcon } from 'lucide-react';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { logger } from '~/lib/logger';
import { writeClipboard } from '~/lib/utils';

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
        <ScrollArea className="w-full h-44 border rounded-lg relative">
          <Button
            size="icon"
            variant="secondary"
            title="复制失败列表"
            className="absolute right-4 top-2 z-10"
            onClick={() => {
              if (failedIds.length > 0) writeClipboard(JSON.stringify(failedIds));
              else toast.warning('失败列表为空');
            }}
          >
            <CopyIcon />
          </Button>
          <div className="px-4 py-2">
            {failedIds.length === 0 && <div className="opacity-80 text-sm">失败列表</div>}
            {failedIds.map(id => (
              <motion.div layout key={id}>
                {id}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
