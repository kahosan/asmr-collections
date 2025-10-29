import { motion } from 'framer-motion';

import { Button } from '~/components/ui/button';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import Loading from '~/components/loading';

import { Copy } from 'lucide-react';

import useSWR from 'swr';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- 简单易用（
import limit from 'p-limit';
import { toast } from 'sonner';
import { useRef, useState } from 'react';

import { logger } from '~/lib/logger';
import { fetcher } from '~/lib/fetcher';
import { notifyError, writeClipboard } from '~/lib/utils';

const MAX_CONCURRENT = 10;

export default function BatchUpdateDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { data, isLoading } = useSWR<string[]>(open ? '/api/field/id' : null, fetcher, {
    onError: error => notifyError(error, '获取收藏 ID 列表失败', { duration: 4000 })
  });

  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  const [startBatchUpdating, setStartBatchUpdating] = useState(false);

  const controllerRef = useRef(new AbortController());

  const batchUpdate = () => {
    if (!data || data.length === 0) {
      toast.error('收藏 ID 列表为空');
      return;
    }

    if (startBatchUpdating) {
      toast.warning('批量更新已在进行中', { position: 'bottom-right' });
      return;
    }

    toast.info('开始批量更新');
    setStartBatchUpdating(true);
    setFailedIds([]);

    const p = limit(MAX_CONCURRENT);
    const updateFns = data.sort((a, b) => a.length - b.length).map(id => p(
      async () => {
        setUpdatingIds(ids => [...ids, id]);
        try {
          await fetcher(`/api/work/refresh/${id}`, {
            method: 'PUT',
            signal: controllerRef.current.signal
          });
          toast.success(`${id} 更新成功`);
          setUpdatingIds(ids => ids.filter(i => i !== id));
        } catch (e) {
          logger.error(e, `更新 ${id} 信息失败`);
          setFailedIds(ids => [...ids, id]);
        }
      }
    ));

    // TODO：优化终止逻辑，一下终止太多卡死了
    Promise.all(updateFns).finally(() => {
      controllerRef.current = new AbortController();
      setUpdatingIds([]);
      setStartBatchUpdating(false);
      if (failedIds.length === 0)
        toast.success('批量更新完成', { duration: 4000 });
      else
        toast.error('存在失败的操作', { duration: 4000 });
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (startBatchUpdating)
          toast.warning('请先终止更新', { position: 'bottom-right' });
        else
          setOpen(isOpen);
      }}
    >
      <DialogContent onInteractOutside={e => e.preventDefault()} className="rounded-lg max-w-[90%] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            批量更新收藏信息
          </DialogTitle>
          <DialogDescription>
            从 DLsite 获取最新的信息
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="default" disabled={isLoading || startBatchUpdating} onClick={() => batchUpdate()}>
            更新
          </Button>
          <Button
            variant="outline"
            disabled={!startBatchUpdating}
            onClick={() => {
              controllerRef.current.abort();
              toast.info('批量更新已终止');
            }}
          >
            终止
          </Button>
        </div>
        <div className="flex gap-2 text-sm">
          <ScrollArea className="w-full h-44 border rounded-lg">
            <div className="px-4 py-2 space-y-2">
              {!startBatchUpdating && <div className="opacity-80">更新列表</div>}
              {updatingIds.map(id => (
                <motion.div layout key={id} className="flex gap-2 p-2 rounded-md items-center dark:bg-zinc-900">
                  <Loading isLoading />
                  {id}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="w-full h-44 border rounded-lg relative">
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-2 z-10"
              onClick={() => {
                if (failedIds.length > 0) writeClipboard(JSON.stringify(failedIds));
                else toast.warning('失败列表为空');
              }}
            >
              <Copy />
            </Button>
            <div className="px-4 py-2">
              {failedIds.length === 0 && <div className="opacity-80">失败列表</div>}
              {failedIds.map(id => (
                <motion.div layout key={id} className="">
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
