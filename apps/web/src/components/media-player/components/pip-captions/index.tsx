import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';
import { useAtom, useSetAtom } from 'jotai';
import { useMediaState } from '@vidstack/react';
import { AnimatePresence, motion } from 'framer-motion';

import { pipCaptionsOpenAtom } from '../../hooks/use-pip-open';
import { floatingCaptionsOpenAtom } from '../../hooks/use-floating-open';

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
  const textTrackState = useMediaState('textTrack');
  const [activeCue, setActiveCue] = useState<VTTCue>();

  const pipWindowRef = useRef<Window | null>(null);

  const [open, setPipOpen] = useAtom(pipCaptionsOpenAtom);
  const setFloatingCaptionsOpen = useSetAtom(floatingCaptionsOpenAtom);

  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (open && !pipWindowRef.current) {
      const initPiP = async () => {
        if (!('documentPictureInPicture' in window)) {
          toast.warning('您的浏览器不支持画中画');
          setPipOpen(false);
          return;
        }

        try {
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
          toast.error('开启画中画失败');
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

  useEffect(() => {
    if (!textTrackState) return;

    const onCueChange = () => {
      const cues = textTrackState.activeCues;
      const cue = cues.at(0) as VTTCue | undefined;
      if (cue) setActiveCue(cue);
    };

    textTrackState.addEventListener('load', onCueChange);
    textTrackState.addEventListener('cue-change', onCueChange);

    return () => {
      textTrackState.removeEventListener('load', onCueChange);
      textTrackState.removeEventListener('cue-change', onCueChange);
    };
  }, [textTrackState]);

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
