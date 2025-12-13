import { Button } from '~/components/ui/button';

import { SettingItem } from './setting-item';

import { useToastMutation } from '~/hooks/use-toast-fetch';
import { RefreshCwIcon } from 'lucide-react';

export function GenresSettings({ api}: { api: string }) {
  const [action, isLoading] = useToastMutation('genres-sync');

  const onClick = () => {
    action({
      key: '/api/genres/sync',
      fetchOps: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api })
      },
      toastOps: {
        loading: '正在同步标签...',
        success: '标签同步完成',
        error: '标签同步失败'
      }
    });
  };

  return (
    <SettingItem
      id="genres-sync-from-asmr-one"
      description="同步数据库的标签为和谐之前的名称"
      action={
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onClick}
          disabled={isLoading}
        >
          <RefreshCwIcon />
        </Button>
      }
    >
      同步标签
    </SettingItem>
  );
}
