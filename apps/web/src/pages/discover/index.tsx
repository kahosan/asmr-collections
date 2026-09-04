import { useMemo, useState } from 'react';

import { createLazyRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import type {
  DiscoveryHotProvider,
  DiscoveryRequest
} from '@asmr-collections/shared';

import { DiscoverySection } from '~/components/discovery';
import { NativeSelect } from '~/components/ui/native-select';
import { Separator } from '~/components/ui/separator';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { getDiscoveryDate, getDiscoveryRules, useDiscovery } from '~/hooks/use-discovery';

function DiscoverPage() {
  const options = useAtomValue(settingOptionsAtom);
  const [dailyRotation, setDailyRotation] = useState(0);
  const [hotRotation, setHotRotation] = useState(0);
  const [hotProvider, setHotProvider] = useState<DiscoveryHotProvider>('dlsite');
  const [dailyExcludedIds, setDailyExcludedIds] = useState<string[]>([]);
  const [hotExcludedIds, setHotExcludedIds] = useState<string[]>([]);

  const date = useMemo(() => getDiscoveryDate(), []);
  const rules = useMemo(() => getDiscoveryRules(options.discovery), [options.discovery]);

  const dailyRequest = useMemo<DiscoveryRequest>(() => ({
    scene: 'daily',
    source: options.discovery.source,
    ...(options.discovery.source === 'asmrone' ? { api: options.asmrone.api } : {}),
    mode: 'smart',
    count: options.discovery.dailyCount,
    date,
    seed: `${date}:daily:${dailyRotation}`,
    excludeIds: dailyExcludedIds,
    rules
  }), [date, dailyExcludedIds, dailyRotation, options.asmrone.api, options.discovery.dailyCount, options.discovery.source, rules]);

  const hotRequest = useMemo<DiscoveryRequest>(() => ({
    scene: 'hot',
    provider: hotProvider,
    ...(hotProvider === 'asmrone' ? { api: options.asmrone.api } : {}),
    mode: 'smart',
    count: Math.max(options.discovery.dailyCount, 6),
    date,
    seed: `${date}:hot:${hotProvider}:${hotRotation}`,
    excludeIds: hotExcludedIds,
    rules
  }), [date, hotExcludedIds, hotProvider, hotRotation, options.asmrone.api, options.discovery.dailyCount, rules]);

  const daily = useDiscovery(dailyRequest, '获取今日推荐失败');
  const hot = useDiscovery(hotRequest, '获取热门推荐失败');

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
        onRefresh={() => {
          const ids = daily.data?.data.map(item => item.work.id) ?? [];
          setDailyExcludedIds(current => [...new Set([...current, ...ids])].slice(-400));
          setDailyRotation(value => value + 1);
        }}
      />

      <Separator />

      <DiscoverySection
        title="热门推荐"
        data={hot.data?.data}
        isLoading={hot.isLoading}
        error={hot.error}
        onRefresh={() => {
          const ids = hot.data?.data.map(item => item.work.id) ?? [];
          setHotExcludedIds(current => [...new Set([...current, ...ids])].slice(-400));
          setHotRotation(value => value + 1);
        }}
        action={(
          <NativeSelect
            value={hotProvider}
            onChange={event => {
              const value = event.target.value;
              if (value !== 'dlsite' && value !== 'asmrone' && value !== 'personal') return;
              setHotProvider(value);
              setHotExcludedIds([]);
              setHotRotation(0);
            }}
            aria-label="热门推荐来源"
          >
            <option value="dlsite">DLsite 24 小时热门</option>
            <option value="asmrone">ASMR.ONE 热门</option>
            <option value="personal">猜你喜欢</option>
          </NativeSelect>
        )}
        onExternalAdded={() => {
          void hot.mutate();
        }}
      />
    </div>
  );
}

const Route = createLazyRoute('/app/discover')({
  component: DiscoverPage
});

export default Route;
