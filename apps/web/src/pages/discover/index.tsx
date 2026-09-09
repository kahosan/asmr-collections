import { createLazyRoute } from '@tanstack/react-router';
import { useAtom } from 'jotai';

import { DiscoverySection } from '~/components/discovery';
import { NativeSelect } from '~/components/ui/native-select';
import { Separator } from '~/components/ui/separator';
import { discoveryPeriodAtom, discoveryViewAtom, useDiscoveryRotation } from '~/hooks/use-discovery';

function DiscoverPage() {
  const [view, setView] = useAtom(discoveryViewAtom);
  const [hotPeriod, setHotPeriod] = useAtom(discoveryPeriodAtom);

  const daily = useDiscoveryRotation({ scene: 'daily' }, '获取今日推荐失败');
  const recommendations = useDiscoveryRotation(
    view === 'personal'
      ? { scene: 'personal' }
      : { scene: 'hot', provider: view, period: hotPeriod },
    view === 'personal' ? '获取猜你喜欢失败' : '获取热门榜单失败'
  );

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
        navigation={daily.navigation}
      />

      <Separator />

      <DiscoverySection
        title={view === 'personal' ? '猜你喜欢' : '热门榜单'}
        data={recommendations.data?.data}
        isLoading={recommendations.isLoading}
        error={recommendations.error}
        navigation={recommendations.navigation}
        action={(
          <NativeSelect
            value={view}
            onChange={event => {
              const value = event.target.value;
              if (value !== 'dlsite' && value !== 'asmrone' && value !== 'personal') return;
              setView(value);
            }}
            aria-label="推荐内容"
          >
            <option value="dlsite">DLsite 榜单</option>
            <option value="asmrone">ASMR.ONE 榜单</option>
            <option value="personal">猜你喜欢</option>
          </NativeSelect>
        )}
        period={view === 'dlsite' ? hotPeriod : undefined}
        onPeriodChange={setHotPeriod}
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
