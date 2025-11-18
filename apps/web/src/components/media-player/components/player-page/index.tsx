import { useBlocker } from '@tanstack/react-router';
import { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

import { usePlayerExpand } from '../../hooks/use-player-expand';

import PlayerCover from './cover';
import PlayerSidePanel from './side-panel';
import PlayerPageMain from './page-main';
import TrackInfo from '../track-info';
import PlayerPageActionsAbove from './actions-above';
import RightPlayControls from '../right-controls/right-play';

import { cn } from '~/lib/utils';

type ActiveTab = 'playlist' | 'subtitles' | 'similar' | '';

export default function PlayerPage() {
  const [expand, setExpand] = usePlayerExpand();

  const [mainExpand, setMainExpand] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('');

  if (!expand && !mainExpand) {
    setMainExpand(true);
    if (activeTab !== '')
      setActiveTab('');
  }

  const dragControls = useDragControls();

  const handleTabChange = (tab: string) => {
    if (tab !== '')
      setMainExpand(false);

    setActiveTab(tab as ActiveTab);
  };

  const handleMainClick = () => {
    setMainExpand(p => !p);
    setActiveTab('');
  };

  const isMobile = window.innerWidth <= 640;

  useBlocker({
    shouldBlockFn() {
      setExpand(false);
      return true;
    },
    disabled: !expand || !isMobile
  });

  return (
    <AnimatePresence>
      {expand && (
        <motion.div
          data-player-page={expand}
          key="player-page"
          className={cn(
            'fixed overflow-hidden bg-card',
            'sm:w-85 sm:h-145 sm:bottom-5 sm:right-scroll-locked-5',
            'sm:rounded-md sm:border sm:border-border sm:shadow-lg',
            'max-sm:inset-0 max-sm:pt-5 max-sm:pb-[env(safe-area-inset-bottom)]'
          )}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          drag={mainExpand ? 'y' : false}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            // 如果向下拖动超过 100px 或速度超过 300,则关闭
            if ((info.offset.y > 100 || info.velocity.y > 300) && mainExpand)
              setExpand(false);
          }}
          ref={el => {
            if (!el) return;

            // eslint-disable-next-line sukka/unicorn/consistent-function-scoping -- preventDefault in touchmove to avoid overscroll on mobile
            const handleTouchMove = (e: TouchEvent) => {
              // 只阻止非 touch-auto 元素的触摸移动
              const target = e.target as HTMLElement;
              if (!target.closest('.touch-auto'))
                e.preventDefault();
            };

            el.addEventListener('touchmove', handleTouchMove, { passive: false });
            return () => {
              el.removeEventListener('touchmove', handleTouchMove);
            };
          }}
        >
          <div
            className="h-full px-6 flex flex-col items-center touch-none"
            onPointerDown={e => dragControls.start(e)}
          >
            <AnimatePresence mode="wait">
              {mainExpand
                ? (
                  <motion.div
                    key="main-content"
                    className="flex flex-col items-center w-full justify-between h-full"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <PlayerPageActionsAbove />
                    <PlayerCover onPointerDown={e => dragControls.start(e)} />
                    <div className="w-full flex flex-col items-center max-sm:mt-8">
                      <PlayerPageMain />
                      <motion.div className="w-full max-sm:mt-10 mt-4">
                        <PlayerSidePanel
                          onPointerDown={e => e.stopPropagation()}
                          key={activeTab}
                          onTabChange={handleTabChange}
                          activeTab={activeTab}
                          classNames={{
                            scrollArea: 'hidden'
                          }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                )
                : (
                  <>
                    <motion.div
                      key="controls"
                      className="w-full flex justify-between sm:mt-4 cursor-pointer p-2 bg-accent rounded-sm"
                      onClick={handleMainClick}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <TrackInfo mainExpand={mainExpand} />
                      <div onClick={e => e.stopPropagation()}>
                        <RightPlayControls mainExpand={mainExpand} />
                      </div>
                    </motion.div>
                    <motion.div className="w-full mt-6 sm:mt-2">
                      <PlayerSidePanel
                        key={activeTab}
                        onTabChange={handleTabChange}
                        activeTab={activeTab}
                        classNames={{
                          scrollArea: 'max-md:h-[calc(100dvh-10rem)]'
                        }}
                      />
                    </motion.div>
                  </>
                )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
