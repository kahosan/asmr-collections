import { useMemo, useState } from 'react';

import { createLazyRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { DEFAULT_DLSITE_RANK_PERIOD } from '@asmr-collections/shared';

import type {
  DiscoveryProvider,
  DLsiteRankPeriod
} from '@asmr-collections/shared';

import { DiscoverySection } from '~/components/discovery';
import { NativeSelect } from '~/components/ui/native-select';
import { Separator } from '~/components/ui/separator';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { useDiscovery, useDiscoveryRotation } from '~/hooks/use-discovery';
import { createDiscoveryRequest, getDiscoveryDate } from '~/lib/discovery';

type DiscoveryView = 'personal' | DiscoveryProvider;

function DiscoverPage() {
  const options = useAtomValue(settingOptionsAtom);
  const dailyRotation = useDiscoveryRotation();
  const viewRotation = useDiscoveryRotation();
  const [view, setView] = useState<DiscoveryView>('dlsite');
  const [hotPeriod, setHotPeriod] = useState<DLsiteRankPeriod>(DEFAULT_DLSITE_RANK_PERIOD);

  const date = useMemo(() => getDiscoveryDate(), []);
  const daily = useDiscovery(createDiscoveryRequest(options, {
    scene: 'daily', date, ...dailyRotation.state
  }), '获取今日推荐失败');
  const recommendations = useDiscovery(createDiscoveryRequest(options, {
    ...(view === 'personal'
      ? { scene: 'personal' }
      : { scene: 'hot', provider: view, period: hotPeriod }),
    date,
    ...viewRotation.state
  }), view === 'personal' ? '获取猜你喜欢失败' : '获取热门榜单失败');

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
        title={view === 'personal' ? '猜你喜欢' : '热门榜单'}
        data={recommendations.data?.data}
        isLoading={recommendations.isLoading}
        error={recommendations.error}
        onRefresh={() => viewRotation.refresh(recommendations.data?.data)}
        action={(
          <NativeSelect
            value={view}
            onChange={event => {
              const value = event.target.value;
              if (value !== 'dlsite' && value !== 'asmrone' && value !== 'personal') return;
              setView(value);
              viewRotation.reset();
            }}
            aria-label="推荐内容"
          >
            <option value="dlsite">DLsite 榜单</option>
            <option value="asmrone">ASMR.ONE 榜单</option>
            <option value="personal">猜你喜欢</option>
          </NativeSelect>
        )}
        period={view === 'dlsite' ? hotPeriod : undefined}
        onPeriodChange={period => {
          setHotPeriod(period);
          viewRotation.reset();
        }}
        onExternalAdded={() => {
          recommendations.mutate();
        }}
      />
    </div>
  );
}

const Route = createLazyRoute('/app/discover')({
  component: DiscoverPage
});

export default Route;
