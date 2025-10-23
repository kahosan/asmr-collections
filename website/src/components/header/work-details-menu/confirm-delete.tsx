import { useToastFetch } from '~/hooks/use-toast-fetch';

import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';

import type { Work } from '~/types/work';

export default function ConfirmDeleteDialog({ open, setOpen, id }: { open: boolean, setOpen: (open: boolean) => void, id: string }) {
  const [isLoading, toastcher] = useToastFetch();

  const onConfirm = () => {
    toastcher<Work>(`/api/work/delete/${id}`, { method: 'DELETE' }, {
      loading: `${id} 删除中...`,
      success: `${id} 删除成功`,
      error: `${id} 删除失败`,
      finally() {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>确定要删除收藏吗?</DialogTitle>
          <DialogDescription>
            认真考虑哦
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="secondary" onClick={onConfirm} disabled={isLoading}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
