import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import WorkInput from '~/components/work-input';

import { toast } from 'sonner';
import { useState } from 'react';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { parseWorkInput } from '~/utils';
import { mutateWorks } from '~/lib/mutation';

import type { WorkCreateResponse } from '~/types/work';

export default function AddWorkDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [id, setId] = useState<string>('');

  const [createAction, isMutating] = useToastMutation<WorkCreateResponse>('create');

  const { validIds, isEmpty, isValid } = parseWorkInput(id);

  const buttonDisabled = isMutating || isEmpty || !isValid;

  const handleCreate = () => {
    createAction({
      key: `/api/work/create/${validIds[0]}`,
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
          return `${id} 添加失败`;
        },
        finally() {
          mutateWorks();
        }
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (isMutating)
          toast.warning('请先等待添加完成');
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
          <WorkInput
            placeholder="作品 ID"
            value={id}
            initialTip="支持 R/B/V ID"
            validTip="按回车或点击按钮添加"
            onValueChange={v => setId(v)}
            onKeyUp={e => e.key === 'Enter' && handleCreate()}
          />
          <Button variant="outline" onClick={handleCreate} disabled={buttonDisabled}>
            添加
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
