import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog';

import { SettingsDialogContent } from './settings-dialog-content';

export default function SettingsDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogContent
        className="rounded-lg max-w-[90%] sm:max-w-lg"
        onOpenAutoFocus={event => {
          event.preventDefault();
        }}
      >
        <SettingsDialogContent key={open ? 'open' : 'close'} setOpen={setOpen} />
      </AlertDialogContent>
    </AlertDialog>
  );
}
