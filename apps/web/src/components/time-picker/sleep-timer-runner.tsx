import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai/react';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { sleepDeadlineAtom } from '~/hooks/use-sleep-timer';

import { Moon } from 'lucide-react';

export function SleepTimerRunner() {
  const deadline = useAtomValue(sleepDeadlineAtom);
  const setDeadline = useSetAtom(sleepDeadlineAtom);
  const setMediaState = useSetAtom(mediaStateAtom);

  useEffect(() => {
    if (deadline == null) return;

    const fire = () => {
      setDeadline(null);
      setMediaState({ open: false });
      toast('已停止播放', { duration: 4000, icon: <Moon className="min-size-5 max-size-5" /> });
    };

    const check = () => {
      if (Date.now() >= deadline) fire();
    };

    const id = window.setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);

    const audio = document.querySelector('audio');
    audio?.addEventListener('timeupdate', check);

    check();

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
      audio?.removeEventListener('timeupdate', check);
    };
  }, [deadline, setDeadline, setMediaState]);

  return null;
}
