import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { format } from 'date-fns/format';

import { sleepDeadlineAtom } from '~/hooks/use-sleep-timer';

import { Moon } from 'lucide-react';
import { TimePicker } from '~/components/time-picker';

interface SleepModeDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function SleepModeDialog({ open, setOpen }: SleepModeDialogProps) {
  const setDeadline = useSetAtom(sleepDeadlineAtom);

  const onConfirm = (timestamp: number) => {
    setDeadline(timestamp);
    toast(`将于 ${format(timestamp, 'HH:mm')} 停止播放`, {
      duration: 4000,
      icon: <Moon className="min-size-5 max-size-5" />
    });
  };

  const onCancelTimer = () => {
    setDeadline(null);
    toast('已取消定时停止播放', { duration: 4000, icon: <Moon className="min-size-5 max-size-5" /> });
  };

  return (
    <TimePicker
      key={open ? 'open' : 'closed'}
      open={open}
      setOpen={setOpen}
      onConfirm={onConfirm}
      onCancelTimer={onCancelTimer}
    />
  );
}
