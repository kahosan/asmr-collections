import '@videojs/react/video/neutral-skin.css';
import './captions.css';

import { NeutralVideoSkin, Video, VideoPlayer } from '@videojs/react/video';

import { useAtomValue, useSetAtom } from 'jotai';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { motion } from 'motion/react';

import { VideoToolbar } from './toolbar';
import { captionSizeAtom } from './hooks/use-caption-size';

import { mediaStateAtom } from '~/hooks/use-media-state';

import type { MediaProps } from '../types';

const transition = { duration: 0.25, ease: 'easeOut' } as const;

// 沉浸模式：遮罩挂载时禁止页面滚动，卸载时恢复
function lockBodyScroll() {
  const { overflow } = document.body.style;
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = overflow;
  };
}

export function VideoMedia({ track, subtitleSrc, prev, next, ...events }: MediaProps) {
  const setMediaState = useSetAtom(mediaStateAtom);
  const captionSize = useAtomValue(captionSizeAtom);

  // 关闭时先播放退场动画，结束后再关闭播放器
  const [closing, setClosing] = useState(false);

  // 视频不走转码，直接播放原文件
  const src = track?.mediaDownloadUrl || track?.mediaStreamUrl;

  return createPortal(
    <>
      <motion.div
        ref={lockBodyScroll}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={transition}
      />
      <motion.div
        data-caption-size={captionSize}
        className="video-media fixed top-1/2 left-1/2 z-40 flex w-[calc(100vw-1.5rem)] sm:w-[min(64rem,calc(100vw-4rem))] -translate-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={closing ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={transition}
        onAnimationComplete={() => {
          if (closing) setMediaState({ open: false });
        }}
      >
        <VideoPlayer>
          <NeutralVideoSkin className="w-full aspect-video shadow-lg">
            <Video autoPlay playsInline src={src} {...events}>
              {subtitleSrc && (
                <track
                  key={subtitleSrc}
                  kind="subtitles"
                  label="Chinese"
                  srcLang="zh"
                  src={subtitleSrc}
                />
              )}
            </Video>
          </NeutralVideoSkin>
          <VideoToolbar
            title={track?.title}
            prev={prev}
            next={next}
            onClose={() => setClosing(true)}
          />
        </VideoPlayer>
      </motion.div>
    </>,
    document.body
  );
}
