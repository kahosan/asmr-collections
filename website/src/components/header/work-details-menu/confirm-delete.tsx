import { useToastMutation } from '~/hooks/use-toast-fetch';

import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';

interface ConfirmDeleteDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  id: string
  mutate: () => void
}

export default function ConfirmDeleteDialog({ open, setOpen, id, mutate }: ConfirmDeleteDialogProps) {
  const [deleteAction, deleteIsMutating] = useToastMutation('delete');

  const onConfirm = () => {
    deleteAction({
      key: `/api/work/delete/${id}`,
      fetchOps: { method: 'DELETE' },
      toastOps: {
        loading: `${id} 删除中...`,
        success: `${id} 删除成功`,
        error: `${id} 删除失败`,
        finally() {
          setOpen(false);
          mutate();
        }
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
          <Button variant="secondary" onClick={onConfirm} disabled={deleteIsMutating}>
            确定
          </Button>
          <Button onClick={() => setOpen(false)}>取消</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
