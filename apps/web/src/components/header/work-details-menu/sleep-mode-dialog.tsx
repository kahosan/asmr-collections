import { getHours } from 'date-fns/getHours';
import { getMinutes } from 'date-fns/getMinutes';
import { useSetAtom } from 'jotai';
import { Moon } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { TimePicker } from '~/components/time-picker';
import { mediaAtom } from '~/hooks/use-media-state';

interface SleepModeDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function SleepModeDialog({ open, setOpen }: SleepModeDialogProps) {
  const setMediaState = useSetAtom(mediaAtom);

  const timer = useRef<number>(null);

  const onConfirm = (timestamp: number) => {
    if (timer.current) clearTimeout(timer.current);

    const now = new Date();
    const delay = timestamp - now.getTime();

    timer.current = window.setTimeout(() => {
      setMediaState(({ open: false }));
      toast('已停止播放', {
        duration: 4000,
        icon: <Moon className="min-size-5 max-size-5" />
      });
      timer.current = null;
    }, delay);

    const target = new Date(timestamp);

    let h: string | number = getHours(target);
    h = (h < 10 ? `0${h}` : h);
    let m: string | number = getMinutes(target);
    m = (m < 10 ? `0${m}` : m);

    toast(`将于 ${h}:${m} 停止播放`, {
      duration: 4000,
      icon: <Moon className="min-size-5 max-size-5" />
    });
  };

  const onCancelTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    toast('已取消定时停止播放', {
      duration: 4000,
      icon: <Moon className="min-size-5 max-size-5" />
    });
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
