import { useMemo, useState } from 'react';

import { createLazyRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { DEFAULT_DLSITE_RANK_PERIOD } from '@asmr-collections/shared';

import type {
  DiscoveryHotProvider,
  DLsiteRankPeriod
} from '@asmr-collections/shared';

import { DiscoverySection } from '~/components/discovery';
import { NativeSelect } from '~/components/ui/native-select';
import { Separator } from '~/components/ui/separator';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { useDiscovery, useDiscoveryRotation } from '~/hooks/use-discovery';
import { createDiscoveryRequest, getDiscoveryDate } from '~/lib/discovery';

function DiscoverPage() {
  const options = useAtomValue(settingOptionsAtom);
  const dailyRotation = useDiscoveryRotation();
  const hotRotation = useDiscoveryRotation();
  const [hotProvider, setHotProvider] = useState<DiscoveryHotProvider>('dlsite');
  const [hotPeriod, setHotPeriod] = useState<DLsiteRankPeriod>(DEFAULT_DLSITE_RANK_PERIOD);

  const date = useMemo(() => getDiscoveryDate(), []);
  const daily = useDiscovery(createDiscoveryRequest(options, {
    scene: 'daily', date, ...dailyRotation.state
  }), '获取今日推荐失败');
  const hot = useDiscovery(createDiscoveryRequest(options, {
    scene: 'hot', provider: hotProvider, period: hotPeriod, date, ...hotRotation.state
  }), '获取热门推荐失败');

  return (
    <div className="max-w-7xl mx-auto mt-4 space-y-8">
      <div>
        <h1 className="text-3xl font-medium">发现</h1>
        <p className="text-sm text-muted-foreground mt-1">根据播放习惯和热门来源挑选下一部作品</p>
      </div>

      <DiscoverySection
        title="今日推荐"
        data={daily.data?.data}
        isLoading={daily.isLoading}
        error={daily.error}
        onRefresh={() => dailyRotation.refresh(daily.data?.data)}
      />

      <Separator />

      <DiscoverySection
        title="热门推荐"
        data={hot.data?.data}
        isLoading={hot.isLoading}
        error={hot.error}
        onRefresh={() => hotRotation.refresh(hot.data?.data)}
        action={(
          <NativeSelect
            value={hotProvider}
            onChange={event => {
              const value = event.target.value;
              if (value !== 'dlsite' && value !== 'asmrone' && value !== 'personal') return;
              setHotProvider(value);
              hotRotation.reset();
            }}
            aria-label="热门推荐来源"
          >
            <option value="dlsite">DLsite 热门</option>
            <option value="asmrone">ASMR.ONE 热门</option>
            <option value="personal">猜你喜欢</option>
          </NativeSelect>
        )}
        period={hotProvider === 'dlsite' ? hotPeriod : undefined}
        onPeriodChange={period => {
          setHotPeriod(period);
          hotRotation.reset();
        }}
        onExternalAdded={() => {
          hot.mutate();
        }}
      />
    </div>
  );
}

const Route = createLazyRoute('/app/discover')({
  component: DiscoverPage
});

export default Route;
