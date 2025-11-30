import { createPortal } from 'react-dom';
import { useCallback, useState } from 'react';

import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';

import { floatingCaptionsOpenAtom } from '../../hooks/use-floating-open';

import { Button } from '~/components/ui/button';
import { PictureInPicture2Icon, PictureInPictureIcon } from 'lucide-react';

import { logger } from '~/lib/logger';

interface DocumentPictureInPictureOptions {
  width?: number
  height?: number
}

interface DocumentPictureInPicture extends EventTarget {
  readonly window: Window | null
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>
}

interface PipCaptionsProps {
  activeCue: VTTCue | null
}

export default function PipCaptions({ activeCue }: PipCaptionsProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const setFloatingCaptionsOpen = useSetAtom(floatingCaptionsOpenAtom);

  const textColor = document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000';
  const backgroundColor = document.documentElement.classList.contains('dark') ? '#000000' : '#FFFFFF';

  const destoryPiP = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
    setFloatingCaptionsOpen(true);
  }, [pipWindow, setFloatingCaptionsOpen]);

  const togglePiP = useCallback(async () => {
    if (pipWindow) return destoryPiP();

    if (!('documentPictureInPicture' in window)) {
      toast.warning('您的浏览器不支持画中画');
      return;
    }

    try {
      const pip = await (window.documentPictureInPicture as DocumentPictureInPicture).requestWindow({
        width: 400,
        height: 100
      });

      pip.document.body.style.margin = '0';

      pip.addEventListener('pagehide', destoryPiP);

      setFloatingCaptionsOpen(false);
      setPipWindow(pip);
    } catch (err) {
      toast.error('开启画中画失败');
      logger.error(err, '开启画中画失败');
    }
  }, [pipWindow, setFloatingCaptionsOpen, destoryPiP]);

  return (
    <>
      <Button
        variant="secondary"
        size="icon-sm"
        className="text-sm"
        onClick={togglePiP}
        title={pipWindow ? '关闭字幕画中画' : '开启字幕画中画'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pipWindow ? 'pip-on' : 'pip-off'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {pipWindow ? <PictureInPictureIcon /> : <PictureInPicture2Icon />}
          </motion.div>
        </AnimatePresence>
      </Button>

      {pipWindow && createPortal(
        <div
          style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor,
            color: textColor,
            overflow: 'hidden',
            padding: '4px',
            boxSizing: 'border-box'
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={activeCue?.text || 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              style={{
                fontFamily: 'HarmonyOS Sans, sans-serif',
                textAlign: 'center',
                fontSize: 'clamp(14px, 5vw, 50px)',
                fontWeight: 600,
                lineHeight: 1.4,
                textWrap: 'balance',
                margin: 0
              }}
            >
              {activeCue?.text || '...'}
            </motion.p>
          </AnimatePresence>
        </div>,
        pipWindow.document.body
      )}
    </>
  );
}
