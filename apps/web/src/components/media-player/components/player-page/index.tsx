import { useEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { playerExpandAtom } from '../../hooks/use-player-expand';

import { Button } from '~/components/ui/button';

import PlayerCover from './cover';
import PlayerSidePanel from './side-panel';
import PlayerPageMain from './mobile-main';
import MiddleControls from '../middle-controls';
import PlayerPageActionsAbove from './actions-above';
import RightPlayControls from '../right-controls/right-play';

import BackToWorkDetails from '../settings-menu/back-to-work-details';

type ActiveTab = 'playlist' | 'subtitles' | 'similar' | '';

export default function PlayerPage() {
  const expand = useAtomValue(playerExpandAtom);
  const setExpand = useSetAtom(playerExpandAtom);

  const [mainExpand, setMainExpand] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('');
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined')
      return window.innerWidth < 640;
    return false;
  });

  const handleTabChange = (tab: string) => {
    if (tab !== '')
      setMainExpand(false);

    setActiveTab(tab as ActiveTab);
  };

  const handleMainClick = () => {
    setMainExpand(p => !p);
    setActiveTab('');
  };

  useEffect(() => {
    if (expand)
      document.body.style.overflow = 'hidden';
    else
      document.body.style.overflow = '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [expand]);

  return (
    <AnimatePresence>
      {expand && (
        <motion.div
          className="fixed right-0 w-full h-[100dvh] rounded-md bg-card pt-18 pb-20 bottom-0 max-sm:pt-5 max-sm:pb-0"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          drag={mainExpand && isMobile ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            // 如果向下拖动超过 100px 或速度超过 300,则关闭
            if ((info.offset.y > 100 || info.velocity.y > 300) && (mainExpand && isMobile))
              setExpand(false);
          }}
          ref={() => {
            const checkMobile = () => {
              const mobile = window.innerWidth < 640; // 640px 是 Tailwind 的 sm 断点
              setIsMobile(mobile);
            };

            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
          }}
        >
          <div className="mx-auto max-w-7xl flex px-10 h-full max-md:flex-col items-start gap-10 max-sm:hidden">
            <PlayerCover />
            <PlayerSidePanel />
          </div>
          <div className="h-full px-6 hidden max-sm:flex flex-col items-center">
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
                    <div className="w-full flex flex-col items-center">
                      <PlayerCover />
                      <PlayerPageMain />
                      <Button className="mt-10" variant="secondary">
                        <BackToWorkDetails />
                      </Button>
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
