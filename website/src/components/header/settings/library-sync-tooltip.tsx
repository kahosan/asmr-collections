import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { logger } from '~/lib/logger';

export function LibrarySyncTooltip({ useLib }: { useLib: boolean }) {
  const [syncAction, syncIsMutating] = useToastMutation<{
    message: string
    data: Record<'faileds' | 'successes', string[]>
  }>('sync');

  const onClick = () => {
    syncAction({
      key: '/api/library/sync',
      fetchOps: { method: 'POST' },
      toastOps: {
        success(data) {
          return data.message;
        },
        description(data) {
          if (data.data.faileds.length !== 0 || data.data.successes.length !== 0) {
            logger.info(data);
            return '查看控制台了解详情';
          }

          return data.message;
        },
        loading: '同步中...',
        error: '同步失败'
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" onClick={onClick} disabled={syncIsMutating || !useLib}>同步音声库</Button>
      </TooltipTrigger>
      <TooltipContent>
        当启用本地库时,点击此按钮可以将本地库内的作品同步到数据库中
      </TooltipContent>
    </Tooltip>
  );
}
