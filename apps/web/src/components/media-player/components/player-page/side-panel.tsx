import { ScrollArea } from '~/components/ui/scroll-area';

import Playlist from './playlist';
import Subtitles from './subtitles';
import { Tabs, TabsContent } from '~/components/tabs';

import { useRef, useState } from 'react';
import { cn } from '~/lib/utils';

import type * as TabsPrimitive from '@radix-ui/react-tabs';

type PlayerSidePanelProps = {
  activeTab?: string
  onTabChange?: (tab: string) => void
  classNames?: { scrollArea?: string }
} & React.ComponentProps<typeof TabsPrimitive.Root>;

export default function PlayerSidePanel({ activeTab = 'playlist', onTabChange, classNames, ...rest }: PlayerSidePanelProps) {
  const [tab, setTab] = useState(activeTab);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
      return;
    }
    setTab(value);
  };

  return (
    <Tabs
      {...rest}
      className="touch-auto -mb-px"
      value={tab}
      onValueChange={handleTabChange}
      tabs={[
        { value: 'playlist', label: '播放列表' },
        { value: 'subtitles', label: '字幕' },
        { value: 'similar', label: '相似推荐' }
      ]}
    >
      <ScrollArea
        className={cn('h-110 max-sm:h-[calc(100dvh-10rem)] touch-auto', classNames?.scrollArea)}
        ref={scrollAreaRef}
        overscrollBehavior="contain"
        type="auto"
      >
        <TabsContent value="playlist">
          <Playlist />
        </TabsContent>
        <TabsContent value="subtitles">
          <Subtitles scrollAreaRef={scrollAreaRef} />
        </TabsContent>
        <TabsContent value="similar">
          <div className="p-4">相似推荐内容</div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
