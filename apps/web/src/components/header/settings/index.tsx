import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog';

import { SettingsDialogContent } from './settings-dialog-content';

export default function SettingsDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogContent className="rounded-lg max-w-[95%] sm:max-w-lg px-0">
        <SettingsDialogContent key={open ? 'open' : 'close'} setOpen={setOpen} />
      </AlertDialogContent>
    </AlertDialog>
  );
}
