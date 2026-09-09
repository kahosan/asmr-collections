import { Link } from '~/components/link';

import { motion } from 'framer-motion';
import { useDiscoveryRotation } from '~/hooks/use-discovery';

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
  const { data, error, isLoading, navigation } = useDiscoveryRotation({ scene: 'daily' }, '获取今日推荐失败');

  return (
    <DiscoveryWorks error={error} isLoading={isLoading} data={data?.data} onRetry={navigation.next} compact carousel />
  );
}
