import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Separator } from '~/components/ui/separator';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CopyIcon } from 'lucide-react';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { writeClipboard } from '~/utils';

import { logger } from '~/lib/logger';
import { mutateWorks } from '~/lib/mutation';

import type { BatchOperationResponse, WorkCreateResponse } from '~/types/work';

export default function AddWorkDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [id, setId] = useState<string>();
  const [addIds, setAddIds] = useState<string[]>([]);

  const [failedIds, setFailedIds] = useState<string[]>([]);

  const [createAction, m1] = useToastMutation<WorkCreateResponse>('create');
  const [batchCreateAction, m2] = useToastMutation<BatchOperationResponse>('batch-create');
  const [cancelBatchCreateAction, m3] = useToastMutation<BatchOperationResponse>('batch-create-cancel');

  const isMutating = m1 || m2 || m3;

  const handleCreate = () => {
    if (isMutating) return;

    if (!id) {
      toast.warning('请输入 ID');
      return;
    }

    if (!(/^(?:RJ|BJ|VJ)\d{6,8}$/.test(id))) {
      toast.warning('ID 格式错误');
      return;
    }

    createAction({
      key: `/api/work/create/${id}`,
      fetchOps: { method: 'POST' },
      toastOps: {
        loading: `${id} 添加中...`,
        success() {
          return `${id} 添加成功`;
        },
        description(data) {
          return data.message;
        },
        error() {
          setFailedIds(p => [...p, id]);
          return `${id} 添加失败`;
        },
        finally() {
          mutateWorks();
        }
      }
    });
  };

  const handleBatchCreate = () => {
    if (addIds.length === 0) {
      toast.warning('添加列表为空');
      return;
    }

    if (isMutating) {
      toast.warning('正在操作，请稍后再试', { position: 'bottom-right' });
      return;
    }

    batchCreateAction({
      key: '/api/work/batch/create',
      fetchOps: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: addIds })
      },
      toastOps: {
        loading: '批量添加中...',
        success(data) {
          return data.message;
        },
        description(data) {
          if (data.failed.length > 0) {
            logger.warn(data.failed, '批量添加失败列表');
            setFailedIds(data.failed.map(f => f.id));
            return `添加失败 ${data.failed.length} 个，详情查看控制台`;
          }
        },
        finally() {
          mutateWorks();
        }
      }
    });
  };

  const handleBatchCreateCancel = () => {
    if (!isMutating) {
      toast.warning('当前没有进行中的操作', { position: 'bottom-right' });
      return;
    }

    if (m3) {
      toast.warning('取消操作已在进行中', { position: 'bottom-right' });
      return;
    }

    cancelBatchCreateAction({
      key: '/api/work/batch/cancel',
      fetchOps: { method: 'POST', body: 'create' },
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
          toast.warning('请先等待添加完成', { position: 'bottom-right' });
        else
          setOpen(isOpen);
      }}
    >
      <DialogContent className="rounded-lg max-w-[90%] sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>添加作品</DialogTitle>
          <DialogDescription>从 DLsite 添加作品</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4">
          <Input
            placeholder="作品 ID"
            className="placeholder:text-sm text-sm"
            onChange={e => setId(e.target.value.trim())}
            onKeyUp={e => e.key === 'Enter' && handleCreate()}
          />
          <Button variant="outline" onClick={handleCreate} disabled={isMutating}>
            添加
          </Button>
        </div>
        <Separator />
        <DialogHeader>
          <DialogTitle>批量添加</DialogTitle>
          <DialogDescription>支持逗号、空格、换行分隔</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="default" disabled={isMutating} onClick={handleBatchCreate}>
            添加
          </Button>
          <Button
            variant="outline"
            disabled={m3 || !isMutating}
            onClick={handleBatchCreateCancel}
          >
            取消操作
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Textarea
            className="w-full h-44 border rounded-lg resize-none placeholder:text-sm text-sm"
            placeholder="添加列表"
            onChange={e => setAddIds(e.target.value.split(/[\s,]+/).filter(Boolean))}
            disabled={isMutating}
          />
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
            <div className="px-4 py-2 text-sm">
              {failedIds.length === 0 && <div className="opacity-80 text-sm">失败列表</div>}
              {failedIds.map(id => (
                <motion.div layout key={id}>
                  {id}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
