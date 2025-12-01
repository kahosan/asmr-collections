import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { useAtom, useSetAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';

import { useActiveCue } from '../../hooks/use-active-cue';
import { pipCaptionsOpenAtom } from '../../hooks/use-pip-open';
import { floatingCaptionsOpenAtom } from '../../hooks/use-floating-open';

import { notifyError } from '~/utils';
import { logger } from '~/lib/logger';

interface DocumentPictureInPictureOptions {
  width?: number
  height?: number
}

interface DocumentPictureInPicture extends EventTarget {
  readonly window: Window | null
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>
}

export default function PipCaptions() {
  const { activeCue } = useActiveCue();

  const pipWindowRef = useRef<Window | null>(null);

  const [open, setPipOpen] = useAtom(pipCaptionsOpenAtom);
  const setFloatingCaptionsOpen = useSetAtom(floatingCaptionsOpenAtom);

  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (open && !pipWindowRef.current) {
      const initPiP = async () => {
        try {
          if (!('documentPictureInPicture' in window))
            throw new Error('暂不支持移动端');

          const pip = await (window.documentPictureInPicture as DocumentPictureInPicture).requestWindow({
            width: 400,
            height: 100
          });

          pip.document.body.style.margin = '0';

          // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener -- don't need to remove listener, as pip window will be closed
          pip.addEventListener('pagehide', () => {
            pipWindowRef.current = null;
            setContainer(null);
            setPipOpen(false);
            setFloatingCaptionsOpen(true);
          });

          pipWindowRef.current = pip;

          setContainer(pip.document.body);
          setFloatingCaptionsOpen(false);
        } catch (err) {
          setPipOpen(false);
          notifyError(err, '开启画中画失败');
          logger.error(err, '开启画中画失败');
        }
      };

      initPiP();
    }

    if (!open && pipWindowRef.current)
      pipWindowRef.current.close();

    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, [open, setFloatingCaptionsOpen, setPipOpen]);

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const backgroundColor = isDark ? '#000000' : '#FFFFFF';

  if (!container) return null;

  return createPortal(
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
    container
  );
}
