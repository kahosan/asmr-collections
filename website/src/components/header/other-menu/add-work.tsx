import { motion } from 'framer-motion';

import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Separator } from '~/components/ui/separator';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';

import Loading from '~/components/loading';

import { mutate } from 'swr';
import { toast } from 'sonner';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- 简单易用（
import limit from 'p-limit';
import { useRef, useState } from 'react';

import { useToastFetch } from '~/hooks/use-toast-fetch';

import { fetcher } from '~/lib/fetcher';
import { writeClipboard } from '~/lib/utils';

import type { Work } from '~/types/work';

const MAX_CONCURRENT = 10;

export default function AddWorkDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [id, setId] = useState<string>();

  const [addIds, setAddIds] = useState<string[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  const [startBatchAdd, setStartBatchAdd] = useState(false);

  const controllerRef = useRef(new AbortController());

  const [isLoading, toastcher] = useToastFetch();

  const handleCreate = () => {
    if (isLoading) return;

    if (!id) {
      toast.warning('请输入 ID');
      return;
    }

    if (!(/^(?:RJ|BJ|VJ)\d{6,8}$/.test(id))) {
      toast.warning('ID 格式错误');
      return;
    }

    toastcher<Work>(`/api/work/create/${id}`, { method: 'POST' }, {
      loading: `${id} 添加中...`,
      success() {
        return `${id} 添加成功`;
      },
      error: `${id} 添加失败`,
      finally() {
        mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
      }
    });
  };

  const batchAdd = () => {
    if (isLoading || addIds.length < 0) return;
    if (startBatchAdd) return;
    setStartBatchAdd(true);

    toast.info('开始批量添加');
    setFailedIds([]);

    const p = limit(MAX_CONCURRENT);
    const addFns = addIds.sort((a, b) => a.length - b.length).map(id => p(
      async () => {
        setAddIds(ids => [...ids, id]);
        try {
          await fetcher(`/api/work/create/${id}`, {
            method: 'POST',
            signal: controllerRef.current.signal
          });
          toast.success(`${id} 添加成功`);
          setAddIds(ids => ids.filter(i => i !== id));
        } catch {
          setFailedIds(ids => [...ids, id]);
        }
      }
    ));

    Promise.all(addFns).finally(() => {
      controllerRef.current = new AbortController();
      setAddIds([]);
      setStartBatchAdd(false);
      if (failedIds.length === 0)
        toast.success('批量添加完成', { duration: 4000 });
      else
        toast.error('批量添加失败', { duration: 4000 });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger />
      <DialogContent className="rounded-lg max-w-[90%] sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-left">添加作品</DialogTitle>
          <DialogDescription className="text-left">从 DLsite 添加作品</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4">
          <Input placeholder="RJ263712" onChange={e => setId(e.target.value)} onKeyUp={e => e.key === 'Enter' && handleCreate()} />
          <Button variant="outline" onClick={handleCreate} disabled={isLoading}>
            <Loading isLoading={isLoading} />
            添加
          </Button>
        </div>
        <Separator />
        <DialogHeader>
          <DialogTitle className="text-left">批量添加</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="default" disabled={isLoading || startBatchAdd} onClick={() => batchAdd()}>
            添加
          </Button>
          <Button
            variant="outline"
            disabled={addIds.length === 0 || !startBatchAdd}
            onClick={() => {
              controllerRef.current.abort();
              toast.info('批量添加已终止');
            }}
          >
            终止
          </Button>
        </div>
        <div className="flex gap-2 text-sm">
          <Textarea
            className="w-full h-44 border rounded-lg resize-none placeholder:text-sm"
            placeholder="添加列表 支持逗号、空格、换行分隔"
            onChange={e => setAddIds(e.target.value.split(/[\s,]+/).filter(Boolean))}
            disabled={startBatchAdd}
          />
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
              <div className="i-carbon-copy" />
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
