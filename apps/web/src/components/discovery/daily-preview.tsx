import { useMemo } from 'react';

import { Link } from '~/components/link';

import { useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { useDiscovery } from '~/hooks/use-discovery';
import { createDiscoveryRequest, getDiscoveryDate } from '~/lib/discovery';

import { DiscoveryWorks } from '.';

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
  const { data, error, isLoading } = useDiscovery(createDiscoveryRequest(options, {
    scene: 'daily', date
  }), '获取今日推荐失败');

  return (
    <DiscoveryWorks error={error} isLoading={isLoading} data={data?.data} compact carousel />
  );
}
