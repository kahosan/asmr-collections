import { useMemo } from 'react';

import { Link } from '~/components/link';

import { useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { getDiscoveryDate, getDiscoveryRules, useDiscovery } from '~/hooks/use-discovery';

import { DiscoveryWorks } from '.';

import type { DiscoveryRequest } from '@asmr-collections/shared';

export function DailyDiscoveryPreview() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .3, ease: 'easeOut' }}
      className="mb-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-medium">今日推荐</h2>
        <Link to="/discover" underline="hover" className="text-sm text-muted-foreground">
          查看全部
        </Link>
      </div>
      <DailyPreview />
      <h2 className="text-2xl font-medium mt-12">全部作品</h2>
    </motion.section>
  );
}

function DailyPreview() {
  const options = useAtomValue(settingOptionsAtom);
  const date = useMemo(() => getDiscoveryDate(), []);
  const rules = useMemo(() => getDiscoveryRules(options.discovery), [options.discovery]);

  const request: DiscoveryRequest = {
    scene: 'daily',
    source: options.discovery.source,
    ...(options.discovery.source === 'asmrone' ? { api: options.asmrone.api } : {}),
    mode: 'smart',
    count: options.discovery.dailyCount,
    date,
    seed: `${date}:daily:0`,
    rules
  };

  const { data, error, isLoading } = useDiscovery(request, '获取今日推荐失败');

  return (
    <DiscoveryWorks error={error} isLoading={isLoading} data={data?.data} compact carousel />
  );
}
