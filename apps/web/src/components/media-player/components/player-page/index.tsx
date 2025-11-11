import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { usePlayerExpand } from '../../hooks/use-player-expand';

import PlayerCover from './cover';
import PlayerSidePanel from './side-panel';
import PlayerPageMain from './mobile-main';
import MiddleControls from '../middle-controls';
import PlayerPageActionsAbove from './actions-above';
import RightPlayControls from '../right-controls/right-play';

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

  const isMobile = window.innerWidth < 640;

  const handleTabChange = (tab: string) => {
    if (tab !== '')
      setMainExpand(false);

    setActiveTab(tab as ActiveTab);
  };

  const handleMainClick = () => {
    setMainExpand(p => !p);
    setActiveTab('');
  };

  const hasPushedState = useRef(false);

  useEffect(() => {
    if (expand && !hasPushedState.current) {
      window.history.pushState(null, '', window.location.href);
      hasPushedState.current = true;
    } else if (!expand && hasPushedState.current) {
      window.history.back();
      hasPushedState.current = false;
    }

    const handlePopState = () => {
      hasPushedState.current = false;
      setExpand(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [expand, setExpand]);

  return (
    <AnimatePresence>
      {expand && (
        <motion.div
          data-player-page={expand}
          key="player-page"
          className="fixed inset-0 w-full rounded-md bg-card pt-18 pb-20 max-sm:pt-5 max-sm:pb-[env(safe-area-inset-bottom)]"
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          drag={mainExpand && isMobile ? 'y' : false}
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
              e.preventDefault();
            };

            el.addEventListener('touchmove', handleTouchMove, { passive: false });
            return () => {
              el.removeEventListener('touchmove', handleTouchMove);
            };
          }}
        >
          <div className="mx-auto max-w-7xl flex px-10 h-full max-md:flex-col items-start gap-10 max-sm:hidden">
            <PlayerCover />
            <PlayerSidePanel />
          </div>
          <div
            className="h-full px-6 hidden max-sm:flex flex-col items-center touch-none"
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
                    <div
                      className="w-full flex flex-col items-center touch-auto"
                      onPointerDown={e => {
                        e.stopPropagation();
                      }}
                    >
                      <PlayerPageMain />
                      <motion.div className="w-full mt-10">
                        <PlayerSidePanel
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
                      className="w-full flex justify-between"
                      onClick={handleMainClick}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <MiddleControls />
                      <div onClick={e => e.stopPropagation()}>
                        <RightPlayControls />
                      </div>
                    </motion.div>
                    <motion.div className="w-full mt-10">
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
